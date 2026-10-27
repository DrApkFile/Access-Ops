import { expect, test } from 'bun:test'
import { redact } from './errors'
import { recordSchema } from '@accessops/domain'
test('nested diagnostics redact tokens, connection strings and authorization', () => {
  const value = redact({
    authorization: 'Bearer secret',
    nested: {
      password: 'sensitive',
      uri: 'postgresql://user:secret@db/data',
      description: 'Bearer abc123',
    },
  })
  const out = JSON.stringify(value)
  expect(out).not.toContain('secret')
  expect(out).not.toContain('sensitive')
  expect(out).not.toContain('abc123')
  expect(out).toContain('[REDACTED]')
})
test('untrusted record extra properties do not cross the domain boundary', () =>
  expect(
    recordSchema.safeParse({
      externalId: 'r',
      __sql: 'DROP TABLE observations',
    }).success,
  ).toBe(false))
import { grantsAccess } from './permissions'
test('building grants have bounded ordered permissions', () => {
  expect(grantsAccess('read', 'write')).toBe(false)
  expect(grantsAccess('review', 'write')).toBe(true)
  expect(grantsAccess('manage', 'review')).toBe(true)
  expect(grantsAccess('made-up', 'read')).toBe(false)
})
