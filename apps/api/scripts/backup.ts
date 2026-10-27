import {
  mkdtemp,
  mkdir,
  rm,
  readFile,
  writeFile,
  readdir,
  stat,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { db } from '../src/db'
import { config } from '../src/accessops/config'
import { hash } from '../src/accessops/errors'
const output = process.argv[2]
if (!output || process.env.ACCESSOPS_BACKUP_MAINTENANCE !== '1')
  throw new Error(
    'Usage: maintenance mode + backup.ts <new-output-file>; pause API/workers before backup',
  )
const keyBytes = Buffer.from(process.env.ACCESSOPS_BACKUP_KEY ?? '', 'base64')
if (keyBytes.length !== 32)
  throw new Error(
    'ACCESSOPS_BACKUP_KEY must be a base64 32-byte encryption key; keep it in a separate secret store',
  )
const active =
  await db.$client`select id from ao_jobs where status='running' limit 1`
if (active.length) throw new Error('Active jobs remain; stop and drain workers')
const u = new URL(process.env.DATABASE_URL!)
const env = {
  ...process.env,
  PGHOST: u.hostname,
  PGPORT: u.port || '5432',
  PGDATABASE: decodeURIComponent(u.pathname.slice(1)),
  PGUSER: decodeURIComponent(u.username),
  PGPASSWORD: decodeURIComponent(u.password),
  PGSSLMODE: u.searchParams.get('sslmode') ?? 'disable',
}
const temp = await mkdtemp(path.join(tmpdir(), 'accessops-backup-'))
try {
  const dump = spawnSync(
    'pg_dump',
    [
      '--format=custom',
      '--no-owner',
      '--file',
      path.join(temp, 'database.dump'),
    ],
    { env, encoding: 'utf8' },
  )
  if (dump.status !== 0)
    throw new Error(
      'pg_dump failed (details suppressed to protect connection information)',
    )
  const uploads = path.resolve(config.UPLOADS_DIR)
  const files: { path: string; bytes: number; sha256: string }[] = []
  async function collect(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw new Error('Upload backup refuses symbolic links')
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await collect(full)
      else {
        const relative = path.relative(uploads, full)
        const bytes = await readFile(full)
        const target = path.join(temp, 'uploads', relative)
        await mkdir(path.dirname(target), { recursive: true, mode: 0o700 })
        await writeFile(target, bytes, { mode: 0o600 })
        files.push({ path: relative, bytes: bytes.length, sha256: hash(bytes) })
      }
    }
  }
  await mkdir(path.join(temp, 'uploads'), { mode: 0o700 })
  await collect(uploads)
  const counts: Record<string, number> = {}
  for (const table of [
    'ao_buildings',
    'ao_observations',
    'ao_investigations',
    'ao_actions',
    'projects',
    'floor_models',
    'tactile_designs',
    'exports',
  ]) {
    const r = await db.$client.unsafe(
      'select count(*)::int as count from ' + table,
    )
    counts[table] = r[0].count
  }
  await writeFile(
    path.join(temp, 'manifest.json'),
    JSON.stringify(
      {
        version: 1,
        createdAt: new Date().toISOString(),
        uploadsRoot: uploads,
        files,
        counts,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  )
  const packed = spawnSync('tar', [
    '-czf',
    path.join(temp, 'bundle.tgz'),
    '-C',
    temp,
    'database.dump',
    'manifest.json',
    'uploads',
  ])
  if (packed.status !== 0) throw new Error('Backup archive failed')
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
    'encrypt',
  ])
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      new Uint8Array(await readFile(path.join(temp, 'bundle.tgz'))),
    ),
  )
  await writeFile(
    output,
    Buffer.concat([
      Buffer.from('AOBACKUP1'),
      Buffer.from(nonce),
      Buffer.from(encrypted),
    ]),
    { flag: 'wx', mode: 0o600 },
  )
  console.log(
    JSON.stringify({
      backup: path.resolve(output),
      encrypted: true,
      files: files.length,
      counts,
    }),
  )
} finally {
  await rm(temp, { recursive: true, force: true })
  await db.$client.close()
}
