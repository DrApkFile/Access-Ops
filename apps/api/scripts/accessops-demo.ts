import { runDemo, type Client } from './demo-workflow'
const input = JSON.parse(await Bun.stdin.text()) as {
  email: string
  password: string
  workspaceId: string
}
const origin = process.env.API_URL ?? 'http://localhost:3003'
let cookie = ''
const client: Client = {
  async request(path, method = 'GET', body, expected = 200) {
    const r = await fetch(origin + path, {
      method,
      headers: {
        cookie,
        'content-type': 'application/json',
        'x-accessops-request': '1',
        'idempotency-key': crypto.randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (r.headers.get('set-cookie'))
      cookie = r.headers.get('set-cookie')!.split(';')[0]!
    const json = await r.json()
    if (r.status !== expected)
      throw new Error(
        path + ' returned ' + r.status + ': ' + JSON.stringify(json),
      )
    return json
  },
  async upload(bytes, name, mime) {
    const form = new FormData()
    form.set('file', new File([bytes], name, { type: mime }))
    const r = await fetch(origin + '/projects', {
      method: 'POST',
      headers: { cookie, 'x-accessops-request': '1' },
      body: form,
    })
    if (r.status !== 201) throw new Error('Upload failed')
    return r.json()
  },
}
const principal = await client.request('/auth/login', 'POST', input)
const result = await runDemo(client, principal.userId)
const output = process.env.DEMO_EVIDENCE_PATH
if (output) {
  await Bun.write(output, JSON.stringify(result, null, 2))
  console.log(
    JSON.stringify({ evidence: output, buildingId: result.buildingId }),
  )
}
