import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
const failures: string[] = []
async function scan(dir: string) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (
      [
        'node_modules',
        '.next',
        '.git',
        '.accessops-local',
        'dist',
        'data',
      ].includes(e.name)
    )
      continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await scan(p)
    else if (/\.(ts|tsx|md|yaml|json)$/.test(p)) {
      const s = await readFile(p, 'utf8')
      if (/(?:nvapi-|sk-proj-|sk-or-v1-|gsk_)[a-zA-Z0-9_-]{24,}/.test(s))
        failures.push(p + ': potential hardcoded API secret')
      if (
        p.includes('apps/web/src') &&
        /process\.env\.(NVIDIA_API_KEY|GEMINI_API_KEY|GROQ_API_KEY|OPENROUTER_API_KEY|METERLESS_RUNTIME_TOKEN|ZETARIS_API_KEY|DATABASE_URL)/.test(
          s,
        )
      )
        failures.push(p + ': server secret referenced in browser source')
    }
  }
}
await scan('.')
console.log(JSON.stringify({ check: 'source-secret-boundaries', failures }))
if (failures.length) process.exitCode = 1
