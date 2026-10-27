import { afterEach, test, expect } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import * as mupdf from 'mupdf'
import { imageSize } from 'image-size'
import { runNvidiaTurn } from './nvidia'
import { withProviderWorkspace } from '../providers/workspace-scope'
import { captureModelExecutions } from '../providers/model-executions'
import {
  OMNI_VISION_MODEL,
  SUPER_VISION_MODEL,
  visionReadiness,
} from '../providers/vision-configuration'
import { prepareVisionImage } from '../lib/vision-image'
import { hash } from '../accessops/errors'
import { svgFont } from '../lib/svg-font'
const keys = [
  'NVIDIA_API_KEY',
  'NVIDIA_VISION_MODEL',
  'ACCESSOPS_PROVIDER_WORKSPACES',
  'MODEL_MAX_OUTPUT_TOKENS',
  'ACCESSOPS_PROVIDER_EVIDENCE_DIR',
] as const
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]))
afterEach(() => {
  for (const k of keys) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})
const png = new Resvg(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="white"/><path d="M20 20H220V140H20Z" fill="none" stroke="black" stroke-width="4"/></svg>',
  { font: svgFont },
)
  .render()
  .asPng()
const base64 = Buffer.from(png).toString('base64')
function setup() {
  process.env.NVIDIA_API_KEY = 'unit-nvidia-key-only'
  process.env.NVIDIA_VISION_MODEL = OMNI_VISION_MODEL
  process.env.ACCESSOPS_PROVIDER_WORKSPACES = 'unit-workspace'
  delete process.env.ACCESSOPS_PROVIDER_EVIDENCE_DIR
}
const options = () => ({
  agentName: 'Unit parser',
  instruction: 'Inspect only the synthetic fixture',
  model: process.env.NVIDIA_VISION_MODEL!,
  parts: [
    { text: 'Inspect this synthetic fixture' },
    { inlineData: { mimeType: 'image/png', data: base64 } },
  ],
})
function invoke(
  transport: Parameters<typeof runNvidiaTurn>[1],
  input = options(),
) {
  return withProviderWorkspace('unit-workspace', () =>
    runNvidiaTurn(input, transport),
  )
}
function response(
  model = OMNI_VISION_MODEL,
  content = '{"fixture":true}',
  finish_reason = 'stop',
) {
  return Response.json({
    id: 'unit-call',
    model,
    choices: [{ finish_reason, message: { content } }],
  })
}
function models() {
  return Response.json({ data: [{ id: process.env.NVIDIA_VISION_MODEL }] })
}
test('MOCKED_INTEGRATION: NVIDIA image request uses a documented vision model, RGB PNG, actual headers and disabled thinking', async () => {
  setup()
  let calls = 0
  const text = await invoke(async (url, init) => {
    calls++
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer unit-nvidia-key-only',
    )
    if (String(url).endsWith('/models')) return models()
    const body = JSON.parse(String(init?.body))
    expect(body.model).toBe(OMNI_VISION_MODEL)
    expect(body.stream).toBe(false)
    expect(body.chat_template_kwargs.enable_thinking).toBe(false)
    const image = body.messages[1].content[1].image_url.url
    expect(image).toStartWith('data:image/png;base64,')
    expect(imageSize(Buffer.from(image.split(',')[1], 'base64'))).toMatchObject(
      { width: 240, height: 160, type: 'png' },
    )
    return response()
  })
  expect(text).toBe('{"fixture":true}')
  expect(calls).toBe(2)
})
test('UNIT: unconsented workspace cannot send a plan to NVIDIA', async () => {
  setup()
  process.env.ACCESSOPS_PROVIDER_WORKSPACES = 'different'
  let calls = 0
  await expect(
    invoke(async () => {
      calls++
      return models()
    }),
  ).rejects.toThrow('WORKSPACE_PROVIDER_CONSENT_REQUIRED')
  expect(calls).toBe(0)
})
test('MOCKED_INTEGRATION: undocumented serving identities remain rejected, including observed Super VL private alias', async () => {
  setup()
  process.env.NVIDIA_VISION_MODEL = SUPER_VISION_MODEL
  await expect(
    invoke(async (url) =>
      String(url).endsWith('/models')
        ? models()
        : response('private/nvidia/nemotron-3.5-super-120b-a12b'),
    ),
  ).rejects.toThrow('PROVIDER_MODEL_IDENTITY_MISMATCH')
})
test('UNIT: text-only Nemotron cannot be declared a vision model', async () => {
  setup()
  process.env.NVIDIA_VISION_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b'
  let calls = 0
  await expect(
    invoke(async () => {
      calls++
      return models()
    }),
  ).rejects.toThrow('NVIDIA_MODEL_HAS_NO_SUPPORTED_VISION_CONTRACT')
  expect(calls).toBe(0)
  expect(visionReadiness().inference).toBe('not_verified')
})
test('UNIT: discovery/configuration does not claim successful vision inference', () => {
  setup()
  expect(visionReadiness()).toMatchObject({
    configured: true,
    model: OMNI_VISION_MODEL,
    inference: 'not_verified_by_configuration_or_text_inference',
  })
})
for (const [mime, data, code] of [
  ['image/svg+xml', base64, 'UNSUPPORTED_VISION_IMAGE_MIME'],
  ['application/pdf', base64, 'UNSUPPORTED_VISION_IMAGE_MIME'],
  ['image/png', 'aW1hZ2U=', 'INVALID_VISION_IMAGE_CONTENT'],
  ['image/png', '!!!', 'INVALID_VISION_IMAGE_ENCODING'],
  ['image/jpeg', base64, 'VISION_IMAGE_MIME_MISMATCH'],
] as const)
  test(
    'UNIT: unsafe image ' + mime + ' / ' + code + ' is rejected before HTTP',
    async () => {
      setup()
      let calls = 0
      await expect(
        invoke(
          async () => {
            calls++
            return models()
          },
          { ...options(), parts: [{ inlineData: { mimeType: mime, data } }] },
        ),
      ).rejects.toThrow(code)
      expect(calls).toBe(0)
    },
  )
test('UNIT: byte/count/pixel budgets reject oversized images before HTTP', async () => {
  setup()
  let calls = 0
  const transport = async () => {
    calls++
    return models()
  }
  await expect(
    invoke(transport, {
      ...options(),
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: 'A'.repeat(8 * 1024 * 1024),
          },
        },
      ],
    }),
  ).rejects.toThrow('NVIDIA_IMAGE_BUDGET_EXCEEDED')
  await expect(
    invoke(transport, {
      ...options(),
      parts: Array.from({ length: 17 }, () => ({
        inlineData: { mimeType: 'image/png', data: base64 },
      })),
    }),
  ).rejects.toThrow('NVIDIA_IMAGE_BUDGET_EXCEEDED')
  expect(() =>
    prepareVisionImage(base64, 'image/png', {
      maxPixels: 100,
      maxImageBytes: 5 * 1024 * 1024,
    }),
  ).toThrow('VISION_IMAGE_PIXEL_BUDGET_EXCEEDED')
  expect(calls).toBe(0)
})
test('UNIT: JPEG is decoded and converted to RGB PNG with identical pixel coordinates', () => {
  const rgb = new mupdf.Pixmap(
    mupdf.ColorSpace.DeviceRGB,
    [0, 0, 240, 160],
    false,
  )
  rgb.clear(255)
  try {
    const jpeg = rgb.asJPEG(90)
    const normalized = prepareVisionImage(
      Buffer.from(jpeg).toString('base64'),
      'image/jpeg',
      { maxImageBytes: 5 * 1024 * 1024, maxPixels: 4e6 },
    )
    expect(normalized.width).toBe(240)
    expect(normalized.height).toBe(160)
    expect(normalized.sourceMime).toBe('image/jpeg')
    expect(imageSize(Buffer.from(normalized.data, 'base64')).type).toBe('png')
  } finally {
    rgb.destroy()
  }
})

for (const status of [401, 403, 404, 429, 503])
  test(
    'MOCKED_INTEGRATION: HTTP ' +
      status +
      ' cannot fabricate extraction or trigger repeated completion',
    async () => {
      setup()
      let posts = 0
      await expect(
        invoke(async (url) => {
          if (String(url).endsWith('/models')) return models()
          posts++
          return new Response('Sensitive error body must not be logged', {
            status,
          })
        }),
      ).rejects.toThrow(
        status === 401 || status === 403
          ? 'PROVIDER_UNAUTHORIZED'
          : status === 429
            ? 'PROVIDER_RATE_LIMITED'
            : 'PROVIDER_HTTP_' + status,
      )
      expect(posts).toBe(1)
    },
  )
test('MOCKED_INTEGRATION: absent model is rejected during actual discovery contract', async () => {
  setup()
  let calls = 0
  await expect(
    invoke(async () => {
      calls++
      return Response.json({ data: [{ id: 'nvidia/text-only' }] })
    }),
  ).rejects.toThrow('CONFIGURED_MODEL_NOT_AVAILABLE')
  expect(calls).toBe(1)
})
test('MOCKED_INTEGRATION: offline/timeout failure never returns fabricated text', async () => {
  setup()
  await expect(
    invoke(async () => {
      throw new DOMException('unit-timeout', 'TimeoutError')
    }),
  ).rejects.toThrow('PROVIDER_OFFLINE_OR_TIMEOUT')
})
for (const raw of [
  { model: OMNI_VISION_MODEL, choices: [] },
  { model: OMNI_VISION_MODEL, choices: [{ message: { content: null } }] },
  { model: OMNI_VISION_MODEL, choices: [{ message: { content: '' } }] },
])
  test('MOCKED_INTEGRATION: malformed/empty provider output rejects extraction', async () => {
    setup()
    await expect(
      invoke(async (url) =>
        String(url).endsWith('/models') ? models() : Response.json(raw),
      ),
    ).rejects.toThrow()
  })
test('MOCKED_INTEGRATION: truncated/whitespace/secret-echo output is rejected', async () => {
  setup()
  for (const [content, finish, code] of [
    ['{}', 'length', 'NVIDIA_OUTPUT_TRUNCATED'],
    ['   ', 'stop', 'NVIDIA_EMPTY_OUTPUT'],
    ['unit-nvidia-key-only', 'stop', 'PROVIDER_SECRET_ECHO_REJECTED'],
  ])
    await expect(
      invoke(async (url) =>
        String(url).endsWith('/models')
          ? models()
          : response(OMNI_VISION_MODEL, content, finish),
      ),
    ).rejects.toThrow(code!)
})
test('MOCKED_INTEGRATION: successful turns retain source hashes and actual model/call identity without image bytes or false review', async () => {
  setup()
  let sent = ''
  const captured = await captureModelExecutions(() =>
    invoke(async (url, init) => {
      if (String(url).endsWith('/models')) return models()
      const body = JSON.parse(String(init?.body))
      sent = body.messages[1].content[1].image_url.url.split(',')[1]
      return response()
    }),
  )
  expect(captured.executions).toHaveLength(1)
  const meta = captured.executions[0]!
  expect(meta.execution).toBe('mocked')
  expect(meta.model).toBe(OMNI_VISION_MODEL)
  expect(meta.capability).toBe('vision')
  expect(meta.requestId).toBe('unit-call')
  expect(meta.geometryReviewed).toBe(false)
  expect(meta.inputImages[0]?.sourceSha256).toBe(hash(png))
  expect(meta.inputImages[0]?.sentSha256).toBe(
    hash(Buffer.from(sent, 'base64')),
  )
  expect(JSON.stringify(meta)).not.toContain(base64)
  expect(JSON.stringify(meta)).not.toContain('unit-nvidia-key-only')
})

test('UNIT: low-level PNG/JPEG renderer rejects undecoded WebP (the application decoder handles it first)', async () => {
  const bytes = await Bun.file(
    new URL(
      '../../../../tests/fixtures/vision/synthetic-control.webp',
      import.meta.url,
    ),
  ).bytes()
  expect(() =>
    prepareVisionImage(Buffer.from(bytes).toString('base64'), 'image/webp', {
      maxImageBytes: 5 * 1024 * 1024,
      maxPixels: 4e6,
    }),
  ).toThrow('UNSUPPORTED_VISION_IMAGE_MIME')
})
