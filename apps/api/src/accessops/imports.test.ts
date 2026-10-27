import { expect, test } from 'bun:test'
import { csvRows, previewImport, safeCsvCell } from './imports'
const record = {
  externalId: '1',
  buildingId: 'b',
  levelId: 'g',
  entityKind: 'door',
  entityName: 'Door',
  namespace: 'audit',
  attribute: 'door_clear_width',
  value: 900,
  unit: 'mm',
  observedAt: '2026-10-26T00:00:00Z',
  verification: 'reported',
  method: 'tape',
  locator: 'row2',
}
test('quoted CSV commas/newlines/quotes are parsed without execution', () =>
  expect(csvRows('id,name\r\n1,"a, b\n""c"""')[0]!.name).toBe('a, b\n"c"'))
test('malformed CSV quotes and duplicate headers are rejected', () => {
  expect(() => csvRows('id,id\n1,2')).toThrow()
  expect(() => csvRows('a\n"unclosed')).toThrow()
  expect(() => csvRows('a,b\n1,2,3')).toThrow()
})
test('preview preserves accepted provenance and reports rejected rows', () => {
  const p = previewImport(
    'json',
    JSON.stringify([record, { ...record, value: 'made up' }]),
  )
  expect(p.accepted[0]!.locator).toBe('row2')
  expect(p.summary).toEqual({
    fetched: 2,
    accepted: 1,
    rejected: 1,
    duplicates: 0,
  })
  expect(p.errors[0]!.row).toBe(2)
})
test('duplicate records produce stable confirmation digest', () => {
  const p = previewImport('json', JSON.stringify([record, record]))
  expect(p.summary.duplicates).toBe(1)
  expect(p.previewHash).toBe(
    previewImport('json', JSON.stringify([record])).previewHash,
  )
})
test('oversized import rejected before parsing', () =>
  expect(() =>
    previewImport('json', ' '.repeat(2 * 1024 * 1024 + 1)),
  ).toThrow())
test('CSV formula exports are escaped including leading whitespace', () => {
  expect(safeCsvCell('=HYPERLINK("evil")')).toStartWith('"\'')
  expect(safeCsvCell(' @SUM(1)')).toStartWith('"\'')
})
test('column mapping and numeric units validated', () => {
  const row = { ...record, width: 900 }
  delete (row as Partial<typeof record>).value
  const p = previewImport('json', JSON.stringify([row]), { width: 'value' })
  expect(p.accepted[0]!.value).toBe(900)
})
