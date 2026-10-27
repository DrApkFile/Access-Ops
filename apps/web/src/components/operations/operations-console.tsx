'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { operationsContent as copy } from '@/data/operations'
import { apiFetch, API_URL } from '@/lib/api'
import { JsonEditor } from './json-editor'
type Building = { id: string; name: string }
type Principal = { userId: string; workspaceId: string; role: string }
export function OperationsConsole() {
  const [principal, setPrincipal] = useState<Principal | null>(null),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [workspace, setWorkspace] = useState(''),
    [buildings, setBuildings] = useState<Building[]>([]),
    [building, setBuilding] = useState(''),
    [name, setName] = useState(''),
    [source, setSource] = useState(''),
    [format, setFormat] = useState<'json' | 'csv'>('json'),
    [content, setContent] = useState('[]'),
    [previewHash, setPreviewHash] = useState(''),
    [allowPartial, setAllowPartial] = useState(false),
    [sourceMetadata, setSourceMetadata] = useState('{}'),
    [graph, setGraph] = useState('{}'),
    [question, setQuestion] = useState(
      'Which destinations are affected by the current operational restrictions?',
    ),
    [profile, setProfile] = useState('{"kind":"step-free"}'),
    [scenario, setScenario] = useState('{"changes":[],"reason":""}'),
    [action, setAction] = useState('{}'),
    [actionId, setActionId] = useState(''),
    [entity, setEntity] = useState('{}'),
    [level, setLevel] = useState('{}'),
    [match, setMatch] = useState('{}'),
    [matchId, setMatchId] = useState(''),
    [conflict, setConflict] = useState('{}'),
    [investigationId, setInvestigationId] = useState(''),
    [useZetaris, setUseZetaris] = useState(false),
    [result, setResult] = useState<unknown>(null),
    [busy, setBusy] = useState(false)
  const request = useCallback(
    async (path: string, method = 'GET', body?: unknown) => {
      const r = await apiFetch(API_URL + path, {
        method,
        headers: {
          'content-type': 'application/json',
          'idempotency-key': crypto.randomUUID(),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
      const value = await r.json()
      if (!r.ok) throw new Error(value.code ?? value.error ?? copy.error)
      return value
    },
    [],
  )
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      setResult(await fn())
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : copy.error })
    } finally {
      setBusy(false)
    }
  }
  const load = useCallback(async () => {
    const me = await request('/auth/me')
    setPrincipal(me)
    const rows = await request('/v1/buildings')
    setBuildings(rows.items)
  }, [request])
  useEffect(() => {
    let active = true
    void request('/auth/me')
      .then((me) => {
        if (active) setPrincipal(me)
        return request('/v1/buildings')
      })
      .then((rows) => {
        if (active) setBuildings(rows.items)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [request])
  return (
    <main className="mx-auto grid max-w-6xl gap-5 p-6">
      <h1 className="text-2xl">{copy.title}</h1>
      <p>{copy.intro}</p>
      <p className="text-sm text-muted-foreground">{copy.notice}</p>
      <Link className="underline" href="/">
        {copy.newPlan}
      </Link>
      {!principal ? (
        <form
          className="grid max-w-md gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await request('/auth/login', 'POST', {
                email,
                password,
                workspaceId: workspace,
              })
              setPassword('')
              await load()
              return { signedIn: true }
            })
          }}
        >
          <label>
            {copy.email}
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            {copy.password}
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label>
            {copy.workspace}
            <Input
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              required
            />
          </label>
          <Button disabled={busy}>{copy.signIn}</Button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {principal.role} · {principal.workspaceId}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                void run(async () => {
                  await request('/auth/logout', 'POST')
                  setPrincipal(null)
                  return { signedOut: true }
                })
              }
            >
              {copy.logout}
            </Button>
            <Button variant="outline" onClick={() => void run(load)}>
              {copy.refresh}
            </Button>
          </div>
          <section className="grid gap-3 border p-4">
            <h2>{copy.buildings}</h2>
            <select
              aria-label={copy.buildings}
              className="border p-2"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            >
              <option value="">{copy.select}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Input
              aria-label={copy.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              disabled={busy || !name}
              onClick={() =>
                void run(async () => {
                  const b = await request('/v1/buildings', 'POST', { name })
                  await load()
                  setBuilding(b.id)
                  return b
                })
              }
            >
              {copy.createBuilding}
            </Button>
            <JsonEditor label={copy.level} value={level} onChange={setLevel} />
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(() =>
                  request(
                    '/v1/buildings/' + building + '/levels',
                    'POST',
                    JSON.parse(level),
                  ),
                )
              }
            >
              {copy.createLevel}
            </Button>
            <JsonEditor
              label={copy.entity}
              value={entity}
              onChange={setEntity}
            />
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(() =>
                  request('/v1/entities', 'POST', {
                    ...JSON.parse(entity),
                    buildingId: building,
                  }),
                )
              }
            >
              {copy.createEntity}
            </Button>
          </section>
          <section className="grid gap-3 border p-4">
            <h2>{copy.sources}</h2>
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(() => request('/v1/sources?buildingId=' + building))
              }
            >
              {copy.loadSources}
            </Button>
            <JsonEditor
              label={copy.sourceTemplate}
              value={sourceMetadata}
              onChange={setSourceMetadata}
            />
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(async () => {
                  const s = await request('/v1/sources', 'POST', {
                    ...JSON.parse(sourceMetadata),
                    buildingId: building,
                  })
                  setSource(s.id)
                  return s
                })
              }
            >
              {copy.register}
            </Button>
            <Input
              aria-label={copy.sourceId}
              value={source}
              onChange={(e) => {
                setSource(e.target.value)
                setPreviewHash('')
              }}
            />
            <Button
              disabled={busy || !source}
              onClick={() =>
                void run(() =>
                  request('/v1/sources/' + source + '/refresh', 'POST', {}),
                )
              }
            >
              {copy.sourceRefresh}
            </Button>
            <select
              aria-label={copy.format}
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as 'csv' | 'json')
                setPreviewHash('')
              }}
            >
              <option>json</option>
              <option>csv</option>
            </select>
            <JsonEditor
              label={copy.content}
              value={content}
              onChange={(v) => {
                setContent(v)
                setPreviewHash('')
              }}
            />
            <Button
              disabled={busy || !source}
              onClick={() =>
                void run(async () => {
                  const v = await request(
                    '/v1/sources/' + source + '/preview',
                    'POST',
                    { format, content },
                  )
                  setPreviewHash(v.previewHash)
                  return v
                })
              }
            >
              {copy.preview}
            </Button>
            <label>
              <input
                type="checkbox"
                checked={allowPartial}
                onChange={(e) => setAllowPartial(e.target.checked)}
              />
              {copy.partial}
            </label>
            <Button
              disabled={busy || !previewHash}
              onClick={() =>
                void run(() =>
                  request('/v1/sources/' + source + '/import', 'POST', {
                    format,
                    content,
                    previewHash,
                    allowPartial,
                  }),
                )
              }
            >
              {copy.commit}
            </Button>
          </section>
          <section className="grid gap-3 border p-4">
            <JsonEditor label={copy.graph} value={graph} onChange={setGraph} />
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  request('/v1/graphs/validate', 'POST', {
                    ...JSON.parse(graph),
                    buildingId: building,
                  }),
                )
              }
            >
              {copy.validate}
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  request('/v1/graphs', 'POST', {
                    ...JSON.parse(graph),
                    buildingId: building,
                    reviewerId: principal.userId,
                  }),
                )
              }
            >
              {copy.saveGraph}
            </Button>
            <Input
              aria-label={copy.matchId}
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
            />
            <JsonEditor label={copy.match} value={match} onChange={setMatch} />
            <Button
              disabled={busy || !matchId}
              onClick={() =>
                void run(() =>
                  request(
                    '/v1/matches/' + matchId + '/confirm',
                    'POST',
                    JSON.parse(match),
                  ),
                )
              }
            >
              {copy.confirmMatch}
            </Button>
            <JsonEditor
              label={copy.conflict}
              value={conflict}
              onChange={setConflict}
            />
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  request(
                    '/v1/conflicts/resolve',
                    'POST',
                    JSON.parse(conflict),
                  ),
                )
              }
            >
              {copy.resolveConflict}
            </Button>
          </section>
          <section className="grid gap-3 border p-4">
            <label>
              {copy.question}
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </label>
            <JsonEditor
              label={copy.profile}
              value={profile}
              onChange={setProfile}
            />
            <label>
              <input
                type="checkbox"
                checked={useZetaris}
                onChange={(e) => setUseZetaris(e.target.checked)}
              />
              {copy.useZetaris}
            </label>
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(async () => {
                  const v = await request('/v1/investigations', 'POST', {
                    buildingId: building,
                    question,
                    profile: JSON.parse(profile),
                    asOf: new Date().toISOString(),
                    useZetaris,
                  })
                  setInvestigationId(v.id)
                  return v
                })
              }
            >
              {copy.investigate}
            </Button>
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(() =>
                  request('/v1/investigations?buildingId=' + building),
                )
              }
            >
              {copy.loadHistory}
            </Button>
            <Input
              aria-label={copy.investigationId}
              value={investigationId}
              onChange={(e) => setInvestigationId(e.target.value)}
            />
            <Button
              disabled={busy || !investigationId}
              onClick={() =>
                void run(() => request('/v1/investigations/' + investigationId))
              }
            >
              {copy.snapshot}
            </Button>
            {investigationId && (
              <div className="flex gap-4">
                <a
                  className="underline"
                  href={
                    API_URL +
                    '/v1/investigations/' +
                    investigationId +
                    '/report'
                  }
                  download
                >
                  {copy.report}
                </a>
                <a
                  className="underline"
                  href={
                    API_URL +
                    '/v1/investigations/' +
                    investigationId +
                    '/report?format=html'
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.htmlReport}
                </a>
              </div>
            )}
            <JsonEditor
              label={copy.scenario}
              value={scenario}
              onChange={setScenario}
            />
            <Button
              disabled={busy || !building}
              onClick={() =>
                void run(() =>
                  request('/v1/scenarios', 'POST', {
                    buildingId: building,
                    asOf: new Date().toISOString(),
                    profile: JSON.parse(profile),
                    scenario: JSON.parse(scenario),
                  }),
                )
              }
            >
              {copy.simulate}
            </Button>
          </section>
          <section className="grid gap-3 border p-4">
            <h2>{copy.actions}</h2>
            <Button
              disabled={busy}
              onClick={() => void run(() => request('/v1/actions'))}
            >
              {copy.loadActions}
            </Button>
            <JsonEditor
              label={copy.action}
              value={action}
              onChange={setAction}
            />
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  request('/v1/actions', 'POST', JSON.parse(action)),
                )
              }
            >
              {copy.propose}
            </Button>
            <Input
              aria-label={copy.actionId}
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
            />
            <Button
              disabled={busy || !actionId}
              onClick={() =>
                void run(() =>
                  request(
                    '/v1/actions/' + actionId,
                    'PATCH',
                    JSON.parse(action),
                  ),
                )
              }
            >
              {copy.updateAction}
            </Button>
          </section>
        </>
      )}
      <section aria-live="polite">
        <h2>{copy.results}</h2>
        <pre className="max-h-[48rem] overflow-auto border p-4 text-xs whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    </main>
  )
}
