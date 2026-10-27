import { expect, test } from 'bun:test'
import { imageSize } from 'image-size'
import { prepareNvidiaImage, webpToPng } from './vision-image'
import { hash } from '../accessops/errors'

const fixture = new URL(
  '../../../../tests/fixtures/vision/synthetic-control.webp',
  import.meta.url,
)
const limits = { maxImageBytes: 5 * 1024 * 1024, maxPixels: 4e6 }
test('UNIT: real WebP decode preserves coordinates, source hash and model PNG contract', async () => {
  const bytes = await Bun.file(fixture).bytes()
  const result = await prepareNvidiaImage(
    Buffer.from(bytes).toString('base64'),
    'image/webp',
    limits,
  )
  expect(result.sourceMime).toBe('image/webp')
  expect(result.sourceSha256).toBe(hash(bytes))
  expect(imageSize(Buffer.from(result.data, 'base64'))).toMatchObject({
    width: 500,
    height: 280,
    type: 'png',
  })
  expect(result.sentSha256).toBe(hash(Buffer.from(result.data, 'base64')))
})
test('UNIT: WebP upload normalization caps large plans while preserving aspect ratio', async () => {
  const result = await webpToPng(await Bun.file(fixture).bytes(), limits, 100)
  expect(imageSize(result)).toMatchObject({
    width: 100,
    height: 56,
    type: 'png',
  })
})
test('UNIT: truncated WebP cannot become a fabricated usable PNG', async () => {
  const bytes = await Bun.file(fixture).bytes()
  await expect(
    webpToPng(bytes.slice(0, Math.floor(bytes.length / 2)), limits),
  ).rejects.toThrow()
})
test('UNIT: WebP limits apply before native decoding', async () => {
  const bytes = await Bun.file(fixture).bytes()
  await expect(webpToPng(bytes, { ...limits, maxPixels: 100 })).rejects.toThrow(
    'VISION_IMAGE_PIXEL_BUDGET_EXCEEDED',
  )
  await expect(
    webpToPng(bytes, { ...limits, maxImageBytes: 100 }),
  ).rejects.toThrow('NVIDIA_IMAGE_BUDGET_EXCEEDED')
})
