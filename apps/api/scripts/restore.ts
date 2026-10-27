import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  access,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { SQL } from 'bun'
import { hash } from '../src/accessops/errors'
const [archive, dbname, uploads] = process.argv.slice(2)
if (
  !archive ||
  !dbname ||
  !/^accessops_restore_[a-zA-Z0-9_]+$/.test(dbname) ||
  !uploads ||
  !path.isAbsolute(uploads)
)
  throw new Error(
    'restore.ts <encrypted-backup> <NEW accessops_restore_name> <NEW absolute-uploads-directory>',
  )
try {
  await access(uploads)
  throw new Error('Restore destination already exists; refusing overwrite')
} catch (e) {
  if (!(e instanceof Error) || !('code' in e) || e.code !== 'ENOENT') throw e
}
const bytes = await readFile(archive),
  magic = bytes.subarray(0, 9).toString()
if (magic !== 'AOBACKUP1') throw new Error('Unsupported backup format')
const raw = Buffer.from(process.env.ACCESSOPS_BACKUP_KEY ?? '', 'base64')
if (raw.length !== 32) throw new Error('Backup key required')
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
  'decrypt',
])
const plain = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: bytes.subarray(9, 21) },
  key,
  new Uint8Array(bytes.subarray(21)),
)
const temp = await mkdtemp(path.join(tmpdir(), 'accessops-restore-'))
const u = new URL(process.env.DATABASE_URL!)
const env = {
  ...process.env,
  PGHOST: u.hostname,
  PGPORT: u.port || '5432',
  PGUSER: decodeURIComponent(u.username),
  PGPASSWORD: decodeURIComponent(u.password),
  PGSSLMODE: u.searchParams.get('sslmode') ?? 'disable',
}
try {
  const archivePath = path.join(temp, 'bundle.tgz')
  await writeFile(archivePath, new Uint8Array(plain), { mode: 0o600 })
  const listing = spawnSync('tar', ['-tzf', archivePath], { encoding: 'utf8' })
  if (
    listing.status !== 0 ||
    listing.stdout
      .split('\n')
      .some((p) => p && (path.isAbsolute(p) || p.split('/').includes('..')))
  )
    throw new Error('Unsafe backup archive paths')
  const extracted = spawnSync('tar', [
    '-xzf',
    archivePath,
    '-C',
    temp,
    '--no-same-owner',
    '--no-same-permissions',
  ])
  if (extracted.status !== 0)
    throw new Error('Backup archive could not be extracted')
  const manifest = JSON.parse(
    await readFile(path.join(temp, 'manifest.json'), 'utf8'),
  ) as {
    uploadsRoot: string
    files: { path: string; sha256: string }[]
    counts: Record<string, number>
  }
  for (const file of manifest.files) {
    if (path.isAbsolute(file.path) || file.path.split('/').includes('..'))
      throw new Error('Unsafe manifest path')
    const content = await readFile(path.join(temp, 'uploads', file.path))
    if (hash(content) !== file.sha256)
      throw new Error('File integrity check failed')
  }
  const admin = new SQL(process.env.DATABASE_URL!)
  const exists = await admin`select 1 from pg_database where datname=${dbname}`
  await admin.close()
  if (exists.length) throw new Error('Database exists; refusing to overwrite')
  const create = spawnSync('createdb', [dbname], { env, encoding: 'utf8' })
  if (create.status !== 0)
    throw new Error('Could not create isolated restore database')
  const restored = spawnSync(
    'pg_restore',
    [
      '--no-owner',
      '--no-privileges',
      '--exit-on-error',
      '--dbname',
      dbname,
      path.join(temp, 'database.dump'),
    ],
    { env, encoding: 'utf8' },
  )
  if (restored.status !== 0)
    throw new Error(
      'Restore failed; retain the isolated database for diagnosis',
    )
  await mkdir(uploads, { recursive: false, mode: 0o700 })
  const copy = spawnSync('cp', ['-R', path.join(temp, 'uploads', '.'), uploads])
  if (copy.status !== 0) throw new Error('Restored file copy failed')
  u.pathname = '/' + dbname
  const database = new SQL(u.toString())
  for (const [table, expected] of Object.entries(manifest.counts)) {
    if (
      ![
        'ao_buildings',
        'ao_observations',
        'ao_investigations',
        'ao_actions',
        'projects',
        'floor_models',
        'tactile_designs',
        'exports',
      ].includes(table)
    )
      throw new Error('Unexpected backup count table')
    const rows = await database.unsafe(
      'select count(*)::int as count from ' + table,
    )
    if (rows[0].count !== expected)
      throw new Error('Restored row count mismatch: ' + table)
  }
  const old = manifest.uploadsRoot
  await database`update projects set source_path=replace(source_path,${old},${uploads}),plan_path=replace(plan_path,${old},${uploads})`
  await database`update exports set path=replace(path,${old},${uploads})`
  await database.close()
  console.log(
    JSON.stringify({
      restoredDatabase: dbname,
      uploads,
      verifiedFiles: manifest.files.length,
      counts: manifest.counts,
      productionResourceModified: false,
    }),
  )
} finally {
  await rm(temp, { recursive: true, force: true })
}
