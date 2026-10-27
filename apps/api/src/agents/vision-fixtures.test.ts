import { test, expect } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { imageSize } from 'image-size'
import { createEvaluationFixtures } from '../../scripts/vision-evaluation-fixtures'
import { loadPlanImageParts } from './parser'
import { hash } from '../accessops/errors'

test('LOCAL_INTEGRATION: small/crop/full/PDF images preserve complete source coverage and explicit coordinate transforms', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'accessops-vision-eval-'))
  try {
    const fixtures = await createEvaluationFixtures(directory)
    expect(fixtures).toHaveLength(5)
    const full = fixtures.find((f) => f.id === 'full')!,
      parts = await loadPlanImageParts(path.join(directory, full.filename))
    expect(parts.filter((p) => 'inlineData' in p)).toHaveLength(5)
    const original = parts.find((p) => 'inlineData' in p)
    expect(
      original &&
        'inlineData' in original &&
        hash(Buffer.from(original.inlineData.data, 'base64')),
    ).toBe(full.sourceSha256)
    expect(
      imageSize(await Bun.file(path.join(directory, 'full.png')).bytes()),
    ).toMatchObject({ width: 1800, height: 1200 })
    const crop = fixtures.find((f) => f.id === 'crop')!,
      size = imageSize(
        await Bun.file(path.join(directory, crop.filename)).bytes(),
      )
    expect(
      size.width! * crop.sourceTransform!.scaleX +
        crop.sourceTransform!.offsetX,
    ).toBe(600)
    expect(
      size.height! * crop.sourceTransform!.scaleY +
        crop.sourceTransform!.offsetY,
    ).toBe(400)
    const pdf = fixtures.find((f) => f.id === 'pdf')!,
      pdfSize = imageSize(
        await Bun.file(path.join(directory, pdf.filename)).bytes(),
      )
    expect(pdfSize.width! * pdf.sourceTransform!.scaleX).toBeCloseTo(600)
    expect(pdfSize.height! * pdf.sourceTransform!.scaleY).toBeCloseTo(400)
    expect(
      await Bun.file(path.join(directory, 'synthetic-plan.pdf')).size,
    ).toBeGreaterThan(1000)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
