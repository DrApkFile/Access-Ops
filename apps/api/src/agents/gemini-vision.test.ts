import { test, expect, afterEach } from 'bun:test'
import { Resvg } from '@resvg/resvg-js'
import { imageSize } from 'image-size'
import { runGeminiVisionTurn } from './gemini-vision'
import { runVisionTurn } from './vision'
import {
  selectVision,
  selectedVisionReadiness,
  GEMINI_VISION_MODEL,
} from '../providers/vision-selection'
import { withProviderWorkspace } from '../providers/workspace-scope'
import { captureModelExecutions } from '../providers/model-executions'
import { svgFont } from '../lib/svg-font'
import { hash } from '../accessops/errors'
import type { Transport } from '../providers/http'
import { parseExtractedPlan } from './parser'
const keys = [
  'VISION_PROVIDER',
  'GEMINI_API_KEY',
  'GEMINI_VISION_MODEL',
  'GEMINI_FREE_TIER_CONFIRMED',
  'ACCESSOPS_GEMINI_VISION_WORKSPACES',
  'ACCESSOPS_PROVIDER_WORKSPACES',
  'GEMINI_VISION_MAX_OUTPUT_TOKENS',
  'MODEL_PROVIDER',
  'NVIDIA_MODEL',
] as const
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]))
afterEach(() => {
  for (const k of keys) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})
const png = new Resvg(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/><path d="M10 10H90V90H10Z" fill="none" stroke="black"/></svg>',
  { font: svgFont },
)
  .render()
  .asPng()
function setup() {
  process.env.VISION_PROVIDER = 'gemini'
  process.env.GEMINI_API_KEY = 'unit-gemini-secret-not-real'
  process.env.GEMINI_VISION_MODEL = GEMINI_VISION_MODEL
  process.env.GEMINI_FREE_TIER_CONFIRMED = 'true'
  process.env.ACCESSOPS_PROVIDER_WORKSPACES = 'unit-vision'
  process.env.ACCESSOPS_GEMINI_VISION_WORKSPACES = 'unit-vision'
  delete process.env.GEMINI_VISION_MAX_OUTPUT_TOKENS
}
const options = () => ({
  agentName: 'Synthetic parser',
  instruction: 'Extract only supported JSON',
  parts: [
    {
      inlineData: {
        data: Buffer.from(png).toString('base64'),
        mimeType: 'image/png',
      },
    },
    { text: 'Explicitly synthetic plan' },
  ],
})
const response = (
  content = '{"labels":["CLINIC"]}',
  model = GEMINI_VISION_MODEL,
  finishReason = 'STOP',
) =>
  Response.json({
    modelVersion: model,
    responseId: 'unit-gemini-call',
    candidates: [{ finishReason, content: { parts: [{ text: content }] } }],
  })
const call = (transport: Transport, input = options()) =>
  withProviderWorkspace('unit-vision', () =>
    runGeminiVisionTurn(input, transport),
  )
test('MOCKED_INTEGRATION: original Gemini image content uses the official endpoint and JSON mode without a paid route', async () => {
  setup()
  let calls = 0
  await call(async (url, init) => {
    calls++
    expect(String(url)).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    )
    expect(String(url)).not.toContain(process.env.GEMINI_API_KEY!)
    expect(new Headers(init?.headers).get('x-goog-api-key')).toBe(
      'unit-gemini-secret-not-real',
    )
    expect(new Headers(init?.headers).has('authorization')).toBe(false)
    const body = JSON.parse(String(init?.body))
    expect(body.generationConfig.responseMimeType).toBe('application/json')
    expect(body.contents[0].parts[0].inlineData.mimeType).toBe('image/png')
    expect(
      imageSize(
        Buffer.from(body.contents[0].parts[0].inlineData.data, 'base64'),
      ),
    ).toMatchObject({ width: 100, height: 100 })
    expect(body).not.toHaveProperty('tools')
    return response()
  })
  expect(calls).toBe(1)
})
test('MOCKED_INTEGRATION: vision selection is independent from the NVIDIA text model and records actual Gemini identity', async () => {
  setup()
  process.env.MODEL_PROVIDER = 'nvidia'
  process.env.NVIDIA_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b'
  const captured = await captureModelExecutions(() =>
    withProviderWorkspace('unit-vision', () =>
      runVisionTurn(options(), async (url) => {
        expect(String(url)).toContain('generativelanguage.googleapis.com')
        return response()
      }),
    ),
  )
  expect(captured.executions[0]).toMatchObject({
    provider: 'gemini',
    model: GEMINI_VISION_MODEL,
    capability: 'vision',
    execution: 'mocked',
    requestId: 'unit-gemini-call',
    geometryReviewed: false,
  })
  expect(captured.executions[0]?.inputImages[0]?.sourceSha256).toBe(hash(png))
  expect(JSON.stringify(captured.executions)).not.toContain(
    'unit-gemini-secret-not-real',
  )
  expect(JSON.stringify(captured.executions)).not.toContain(
    Buffer.from(png).toString('base64'),
  )
})
for (const [key, value, code] of [
  ['GEMINI_API_KEY', '', 'GEMINI_VISION_CREDENTIALS_REQUIRED'],
  [
    'GEMINI_FREE_TIER_CONFIRMED',
    'false',
    'GEMINI_FREE_PROJECT_CONFIRMATION_REQUIRED',
  ],
  [
    'ACCESSOPS_GEMINI_VISION_WORKSPACES',
    '',
    'GEMINI_VISION_WORKSPACE_CONSENT_REQUIRED',
  ],
  ['ACCESSOPS_PROVIDER_WORKSPACES', '', 'WORKSPACE_PROVIDER_CONSENT_REQUIRED'],
] as const)
  test(
    'UNIT: missing ' +
      key +
      ' never sends an image or silently switches provider',
    async () => {
      setup()
      process.env[key] = value
      let count = 0
      await expect(
        call(async () => {
          count++
          return response()
        }),
      ).rejects.toThrow(code)
      expect(count).toBe(0)
    },
  )
test('UNIT: only the documented free vision models are selectable, with explicit disable and no automatic fallback', async () => {
  setup()
  expect(selectVision({}).model).toBe(GEMINI_VISION_MODEL)
  expect(() => selectVision({ GEMINI_VISION_MODEL: 'gemini-pro' })).toThrow(
    'GEMINI_VISION_MODEL_NOT_SUPPORTED',
  )
  expect(selectVision({ VISION_PROVIDER: 'openrouter' })).toMatchObject({
    provider: 'openrouter', model: 'nvidia/nemotron-3.5-super-vl:free',
  })
  expect(() => selectVision({ VISION_PROVIDER: 'unknown-provider' })).toThrow(
    'INVALID_VISION_PROVIDER',
  )
  expect(() => selectVision({ GEMINI_FREE_TIER_CONFIRMED: 'yes' })).toThrow(
    'GEMINI_FREE_TIER_CONFIRMATION_INVALID',
  )
  process.env.VISION_PROVIDER = 'none'
  let count = 0
  await expect(
    withProviderWorkspace('unit-vision', () =>
      runVisionTurn(options(), async () => {
        count++
        return response()
      }),
    ),
  ).rejects.toThrow('VISION_INFERENCE_DISABLED')
  expect(count).toBe(0)
})
test('UNIT: readiness distinguishes missing configuration, workspace policy and unverified inference', () => {
  setup()
  expect(selectedVisionReadiness('unit-vision')).toMatchObject({
    provider: 'gemini',
    configured: true,
    workspacePermitted: true,
    inference: 'not_verified_by_configuration_or_text_inference',
    automaticFallback: false,
  })
  expect(selectedVisionReadiness('foreign').state).toBe('consent_required')
  delete process.env.GEMINI_API_KEY
  expect(selectedVisionReadiness('unit-vision')).toMatchObject({
    configured: false,
    missing: ['GEMINI_API_KEY'],
  })
})
for (const [mime, data, code] of [
  [
    'image/svg+xml',
    Buffer.from(png).toString('base64'),
    'UNSUPPORTED_VISION_IMAGE_MIME',
  ],
  [
    'application/pdf',
    Buffer.from(png).toString('base64'),
    'UNSUPPORTED_VISION_IMAGE_MIME',
  ],
  ['image/png', '!!!', 'INVALID_VISION_IMAGE_ENCODING'],
  ['image/png', 'bm90LWEtcGxhbg==', 'INVALID_VISION_IMAGE_CONTENT'],
] as const)
  test(
    'UNIT: invalid image ' + mime + ' rejected before HTTP: ' + code,
    async () => {
      setup()
      let count = 0
      await expect(
        call(
          async () => {
            count++
            return response()
          },
          { ...options(), parts: [{ inlineData: { mimeType: mime, data } }] },
        ),
      ).rejects.toThrow(code)
      expect(count).toBe(0)
    },
  )
test('UNIT: image/count/body/output budgets prevent excessive or text-only requests', async () => {
  setup()
  let calls = 0
  const t: Transport = async () => {
    calls++
    return response()
  }
  await expect(call(t, { ...options(), parts: [] })).rejects.toThrow(
    'GEMINI_VISION_IMAGE_REQUIRED',
  )
  await expect(
    call(t, {
      ...options(),
      parts: Array.from({ length: 17 }, () => options().parts[0]!),
    }),
  ).rejects.toThrow('VISION_IMAGE_COUNT_LIMIT')
  await expect(
    call(t, {
      ...options(),
      parts: [options().parts[0]!, { text: 'x'.repeat(20 * 1024 * 1024) }],
    }),
  ).rejects.toThrow('GEMINI_REQUEST_BUDGET_EXCEEDED')
  process.env.GEMINI_VISION_MAX_OUTPUT_TOKENS = '99999'
  await expect(call(t)).rejects.toThrow('GEMINI_OUTPUT_BUDGET_INVALID')
  expect(calls).toBe(0)
})
for (const [status, code] of [
  [401, 'GEMINI_UNAUTHORIZED'],
  [403, 'GEMINI_UNAUTHORIZED'],
  [404, 'GEMINI_MODEL_NOT_AVAILABLE'],
  [429, 'GEMINI_RATE_LIMITED'],
  [503, 'GEMINI_SERVICE_BUSY'],
] as const)
  test(
    'MOCKED_INTEGRATION: HTTP ' +
      status +
      ' fails safely without retries or a paid fallback',
    async () => {
      setup()
      let calls = 0
      await expect(
        call(async () => {
          calls++
          return new Response('private upstream diagnostic', { status })
        }),
      ).rejects.toThrow(code)
      expect(calls).toBe(1)
    },
  )
test('MOCKED_INTEGRATION: timeout and malformed envelope cannot fabricate an extraction', async () => {
  setup()
  await expect(
    call(async () => {
      throw new DOMException('test only', 'TimeoutError')
    }),
  ).rejects.toThrow('GEMINI_REQUEST_TIMEOUT')
  for (const raw of [
    {},
    { candidates: [] },
    {
      modelVersion: GEMINI_VISION_MODEL,
      candidates: [
        { finishReason: 'STOP', content: { parts: [{ text: null }] } },
      ],
    },
  ])
    await expect(call(async () => Response.json(raw))).rejects.toThrow(
      'GEMINI_INVALID_RESPONSE',
    )
})
for (const [content, model, finish, code] of [
  ['{}', 'private/unknown', 'STOP', 'PROVIDER_MODEL_IDENTITY_MISMATCH'],
  ['{}', GEMINI_VISION_MODEL, 'MAX_TOKENS', 'GEMINI_OUTPUT_TRUNCATED'],
  ['{}', GEMINI_VISION_MODEL, 'SAFETY', 'GEMINI_OUTPUT_REJECTED'],
  ['', GEMINI_VISION_MODEL, 'STOP', 'GEMINI_EMPTY_OUTPUT'],
  ['not json', GEMINI_VISION_MODEL, 'STOP', 'GEMINI_INVALID_OUTPUT_JSON'],
  ['[]', GEMINI_VISION_MODEL, 'STOP', 'GEMINI_INVALID_OUTPUT_JSON'],
  [
    '{"key":"unit-gemini-secret-not-real"}',
    GEMINI_VISION_MODEL,
    'STOP',
    'PROVIDER_SECRET_ECHO_REJECTED',
  ],
] as const)
  test(
    'MOCKED_INTEGRATION: rejected output ' +
      code +
      ' leaves no success receipt',
    async () => {
      setup()
      let receipts: unknown[] = []
      await expect(
        captureModelExecutions(async (records) => {
          receipts = records
          return call(async () => response(content, model, finish))
        }),
      ).rejects.toThrow(code)
      expect(receipts).toHaveLength(0)
    },
  )
test('MOCKED_INTEGRATION: documented stable version suffix is recorded, hidden thought text is excluded', async () => {
  setup()
  const text = await call(async () =>
    Response.json({
      modelVersion: GEMINI_VISION_MODEL + '-001',
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              {
                thought: true,
                text: 'Internal text should not become extraction JSON',
              },
              { text: '{"labels":[]}' },
            ],
          },
        },
      ],
    }),
  )
  expect(text).toBe('{"labels":[]}')
})
const extracted = () => ({
  drawingType: 'floor-plan',
  suitability: 'good',
  suitabilityIssues: [],
  walls: [{ id: 'w1', a: [0, 0, 100, 0], confidence: 0.9 }],
  openings: [],
  rooms: [
    {
      id: 'r1',
      label: 'CLINIC',
      polygon: [
        [10, 10],
        [90, 10],
        [90, 90],
        [10, 90],
      ],
      confidence: 0.9,
    },
  ],
  features: [],
  furniture: [],
})
test('MOCKED_INTEGRATION: real provider-to-Bumps normalizer contract preserves unknown physical scale and rejects hallucinated coordinates', async () => {
  setup()
  const text = await call(async () => response(JSON.stringify(extracted())))
  const model = parseExtractedPlan(text, { widthPx: 100, heightPx: 100 })
  expect(model.rooms[0]?.label).toBe('CLINIC')
  expect(model.plan.pixelsPerMeter).toBeNull()
  const outside = extracted()
  outside.rooms[0]!.polygon[0] = [200, 20]
  expect(() =>
    parseExtractedPlan(JSON.stringify(outside), {
      widthPx: 100,
      heightPx: 100,
    }),
  ).toThrow('EXTRACTED_COORDINATES_OUTSIDE_SOURCE_IMAGE')
  const incomplete = { ...extracted(), rooms: [], walls: [] }
  expect(() =>
    parseExtractedPlan(JSON.stringify(incomplete), {
      widthPx: 100,
      heightPx: 100,
    }),
  ).toThrow('EXTRACTION_HAS_NO_STRUCTURAL_GEOMETRY')
  const zero = extracted()
  zero.walls[0]!.a = [0, 0, 0, 0]
  expect(() =>
    parseExtractedPlan(JSON.stringify(zero), { widthPx: 100, heightPx: 100 }),
  ).toThrow('Wall endpoints must be distinct')
  expect(() =>
    parseExtractedPlan('{}', { widthPx: 100, heightPx: 100 }),
  ).toThrow('schema-invalid output')
})
