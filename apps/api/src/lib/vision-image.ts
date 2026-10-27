import * as mupdf from 'mupdf'
import { imageSize } from 'image-size'
import { AppError, hash } from '../accessops/errors'
import sharp from 'sharp'
type Limits = { maxImageBytes: number; maxPixels: number }
/** Validate encoded bytes, decode and flatten to RGB PNG without changing pixel coordinates. */
function readImage(data: string, mimeType: string, limits: Limits) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType))
    throw new AppError('UNSUPPORTED_VISION_IMAGE_MIME', 422)
  if (data.length > Math.ceil(limits.maxImageBytes / 3) * 4 + 4)
    throw new AppError('NVIDIA_IMAGE_BUDGET_EXCEEDED', 413)
  if (
    !data.length ||
    data.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(data)
  )
    throw new AppError('INVALID_VISION_IMAGE_ENCODING', 422)
  const bytes = Buffer.from(data, 'base64')
  if (bytes.toString('base64') !== data)
    throw new AppError('INVALID_VISION_IMAGE_ENCODING', 422)
  if (bytes.length > limits.maxImageBytes)
    throw new AppError('NVIDIA_IMAGE_BUDGET_EXCEEDED', 413)
  let dimensions
  try {
    dimensions = imageSize(bytes)
  } catch {
    throw new AppError('INVALID_VISION_IMAGE_CONTENT', 422)
  }
  const expected = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice(6)
  if (dimensions.type !== expected || !dimensions.width || !dimensions.height)
    throw new AppError('VISION_IMAGE_MIME_MISMATCH', 422)
  if (dimensions.width * dimensions.height > limits.maxPixels)
    throw new AppError('VISION_IMAGE_PIXEL_BUDGET_EXCEEDED', 413)
  return { bytes, dimensions }
}

/** Existing WebP uploads need decoding before the documented PNG/JPEG model contract. */
export async function webpToPng(
  bytes: Uint8Array,
  limits: Limits,
  maxSide?: number,
) {
  readImage(Buffer.from(bytes).toString('base64'), 'image/webp', limits)
  try {
    let image = sharp(bytes, {
      limitInputPixels: limits.maxPixels,
      failOn: 'warning',
      animated: false,
    })
      .flatten({ background: '#ffffff' })
      .toColourspace('srgb')
    if (maxSide)
      image = image.resize({
        width: maxSide,
        height: maxSide,
        fit: 'inside',
        withoutEnlargement: true,
      })
    const png = await image.png().toBuffer()
    if (png.length > limits.maxImageBytes)
      throw new AppError('NVIDIA_IMAGE_BUDGET_EXCEEDED', 413)
    return png
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('INVALID_VISION_IMAGE_CONTENT', 422)
  }
}

export async function prepareNvidiaImage(
  data: string,
  mimeType: string,
  limits: Limits,
) {
  if (mimeType !== 'image/webp')
    return prepareVisionImage(data, mimeType, limits)
  const { bytes } = readImage(data, mimeType, limits)
  const png = await webpToPng(bytes, limits)
  return {
    ...prepareVisionImage(png.toString('base64'), 'image/png', limits),
    sourceSha256: hash(bytes),
    sourceMime: mimeType,
  }
}
// Shared, provider-independent name; retain the existing NVIDIA import for compatibility.
export async function prepareVisionInput(...args: Parameters<typeof prepareNvidiaImage>) {
  try { return await prepareNvidiaImage(...args) }
  catch (error) {
    if (error instanceof AppError && error.code === 'NVIDIA_IMAGE_BUDGET_EXCEEDED')
      throw new AppError('VISION_IMAGE_BUDGET_EXCEEDED', 413)
    throw error
  }
}

export function prepareVisionImage(
  data: string,
  mimeType: string,
  limits: Limits,
) {
  if (mimeType === 'image/webp')
    throw new AppError('UNSUPPORTED_VISION_IMAGE_MIME', 422)
  const { bytes, dimensions } = readImage(data, mimeType, limits)
  let doc: mupdf.Document | undefined,
    page: mupdf.Page | undefined,
    pixmap: mupdf.Pixmap | undefined,
    device: mupdf.DrawDevice | undefined
  try {
    doc = mupdf.Document.openDocument(bytes, mimeType)
    page = doc.loadPage(0)
    const [x0, y0, x1, y1] = page.getBounds()
    pixmap = new mupdf.Pixmap(
      mupdf.ColorSpace.DeviceRGB,
      [0, 0, dimensions.width, dimensions.height],
      false,
    )
    pixmap.clear(255)
    device = new mupdf.DrawDevice(mupdf.Matrix.identity, pixmap)
    const sx = dimensions.width / (x1 - x0),
      sy = dimensions.height / (y1 - y0)
    page.run(device, [sx, 0, 0, sy, -x0 * sx, -y0 * sy])
    device.close()
    const normalized = pixmap.asPNG()
    if (normalized.length > limits.maxImageBytes)
      throw new AppError('NVIDIA_IMAGE_BUDGET_EXCEEDED', 413)
    return {
      data: Buffer.from(normalized).toString('base64'),
      mimeType: 'image/png',
      sourceSha256: hash(bytes),
      sentSha256: hash(normalized),
      width: dimensions.width,
      height: dimensions.height,
      sourceMime: mimeType,
    }
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError('INVALID_VISION_IMAGE_CONTENT', 422)
  } finally {
    device?.destroy()
    pixmap?.destroy()
    page?.destroy()
    doc?.destroy()
  }
}
