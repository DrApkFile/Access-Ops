import { spawn } from 'node:child_process'
import path from 'node:path'
const root = path.resolve(import.meta.dir, '..')
const portArg = process.argv.find((x) => x.startsWith('--web-port='))
const port = portArg?.split('=')[1] ?? process.env.WEB_PORT ?? '3000'
if (!/^\d+$/.test(port)) throw new Error('Invalid web port')
const commands = [
  { cwd: 'apps/api', args: [process.execPath, '--watch', 'src/index.ts'] },
  { cwd: 'apps/api', args: [process.execPath, '--watch', 'src/worker.ts'] },
  {
    cwd: 'apps/web',
    args: ['node', 'node_modules/next/dist/bin/next', 'dev', '--port', port],
  },
]
const children = commands.map((c) =>
  spawn(c.args[0]!, c.args.slice(1), {
    cwd: path.join(root, c.cwd),
    stdio: 'inherit',
    detached: true,
    env: process.env,
  }),
)
let closing = false
function stop(code: number) {
  if (closing) return
  closing = true
  for (const child of children)
    try {
      if (child.pid) process.kill(-child.pid, 'SIGTERM')
    } catch {}
  setTimeout(() => process.exit(code), 1000)
}
process.on('SIGTERM', () => stop(0))
process.on('SIGINT', () => stop(0))
for (const child of children)
  child.on('exit', (code) => {
    if (!closing) stop(code ?? 1)
  })
