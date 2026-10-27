import { Resvg } from '@resvg/resvg-js'
import * as mupdf from 'mupdf'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { svgFont } from '../src/lib/svg-font'
import { cropPlanImage, pdfFirstPageToPng } from '../src/lib/rasterize'
import { hash } from '../src/accessops/errors'
import { imageSize } from 'image-size'
export async function createEvaluationFixtures(directory: string) {
  if (!path.isAbsolute(directory))
    throw new Error('Absolute private fixture directory required')
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const svg = await readFile(
    new URL(
      '../../../tests/fixtures/vision-evaluation/two-room-plan.svg',
      import.meta.url,
    ),
    'utf8',
  )
  const small = new Resvg(svg, { font: svgFont }).render().asPng()
  const full = new Resvg(svg, {
    font: svgFont,
    fitTo: { mode: 'width', value: 1800 },
  })
    .render()
    .asPng()
  const crop = cropPlanImage(
    small,
    'image/png',
    { left: 0.5, top: 0, width: 0.5, height: 1 },
    600,
  )
  const doc = new mupdf.PDFDocument()
  let image: mupdf.Image | undefined
  let pdf: Uint8Array
  try {
    image = new mupdf.Image(small)
    const ref = doc.addImage(image)
    const page = doc.addPage(
      [0, 0, 600, 400],
      0,
      { XObject: { Im0: ref } },
      'q 600 0 0 400 0 0 cm /Im0 Do Q',
    )
    doc.insertPage(-1, page)
    const buffer = doc.saveToBuffer()
    try {
      pdf = new Uint8Array(buffer.asUint8Array())
    } finally {
      buffer.destroy()
    }
  } finally {
    image?.destroy()
    doc.destroy()
  }
  const derived = pdfFirstPageToPng(pdf),
    invalid = Buffer.from('not an image'),
    pdfSize = imageSize(derived)
  const fixtures: {
    id: string; filename: string; bytes: Uint8Array; expectedLabels: string[];
    sourceTransform: {scaleX:number;scaleY:number;offsetX:number;offsetY:number} | null
  }[] = [
    {
      id: 'small',
      filename: 'small.png',
      bytes: small,
      expectedLabels: ['RECEPTION', 'CLINIC', 'STAIRS', 'ENTRY'],
      sourceTransform: { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 },
    },
    {
      id: 'crop',
      filename: 'crop.png',
      bytes: crop,
      expectedLabels: ['CLINIC', 'STAIRS'],
      sourceTransform: {
        scaleX: 300 / 450,
        scaleY: 400 / 600,
        offsetX: 300,
        offsetY: 0,
      },
    },
    {
      id: 'full',
      filename: 'full.png',
      bytes: full,
      expectedLabels: ['RECEPTION', 'CLINIC', 'STAIRS', 'ENTRY'],
      sourceTransform: { scaleX: 1 / 3, scaleY: 1 / 3, offsetX: 0, offsetY: 0 },
    },
    {
      id: 'pdf',
      filename: 'pdf-derived.png',
      bytes: derived,
      expectedLabels: ['RECEPTION', 'CLINIC', 'STAIRS', 'ENTRY'],
      sourceTransform: {
        scaleX: 600 / pdfSize.width!,
        scaleY: 400 / pdfSize.height!,
        offsetX: 0,
        offsetY: 0,
      },
    },
    {
      id: 'invalid',
      filename: 'invalid.png',
      bytes: invalid,
      expectedLabels: [],
      sourceTransform: null,
    },
  ]
  await writeFile(path.join(directory, 'synthetic-plan.pdf'), pdf, {
    mode: 0o600,
  })
  for (const f of fixtures)
    await writeFile(path.join(directory, f.filename), f.bytes, { mode: 0o600 })
  const manifest = fixtures.map(({ bytes, ...f }) => ({
    ...f,
    sourceSha256: hash(bytes),
  }))
  await writeFile(
    path.join(directory, 'manifest.json'),
    JSON.stringify(
      { synthetic: true, source: 'two-room-plan.svg', fixtures: manifest },
      null,
      2,
    ),
    { mode: 0o600 },
  )
  return manifest
}
if (import.meta.main) {
  const directory = process.env.INTEGRATION_EVIDENCE_DIR
  if (!directory) throw new Error('INTEGRATION_EVIDENCE_DIR required')
  console.log(JSON.stringify(await createEvaluationFixtures(directory)))
}
