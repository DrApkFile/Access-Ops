import { Hono, type MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { and, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { memberships, sessions, users, auditEvents } from './schema'
import { AppError, hash } from './errors'
import { config } from './config'
export type Role = 'viewer' | 'operator' | 'reviewer' | 'source_admin' | 'admin'
export type Principal = {
  userId: string
  workspaceId: string
  role: Role
  access?: import('./permissions').Permission
}
export type Env = {
  Variables: { principal: Principal; requestId: string }
  Bindings: { remoteIp?: string }
}
const rules: Record<string, Role[]> = {
  read: ['viewer', 'operator', 'reviewer', 'source_admin', 'admin'],
  operate: ['operator', 'reviewer', 'admin'],
  review: ['reviewer', 'admin'],
  sources: ['source_admin', 'admin'],
  admin: ['admin'],
}
export function can(role: Role, permission: keyof typeof rules) {
  return rules[permission]?.includes(role) ?? false
}
export function requirePermission(
  permission: keyof typeof rules,
): MiddlewareHandler<Env> {
  return async (c, next) => {
    if (!can(c.get('principal').role, permission))
      throw new AppError('FORBIDDEN', 403)
    const access =
      permission === 'sources' || permission === 'admin'
        ? 'manage'
        : permission === 'review'
          ? 'review'
          : permission === 'operate'
            ? 'write'
            : 'read'
    c.set('principal', { ...c.get('principal'), access })
    await next()
  }
}
export async function audit(
  p: Principal,
  action: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  await db
    .insert(auditEvents)
    .values({
      id: Bun.randomUUIDv7(),
      workspaceId: p.workspaceId,
      actorId: p.userId,
      action,
      targetId,
      metadata,
    })
}
export const authenticate: MiddlewareHandler<Env> = async (c, next) => {
  const token = getCookie(c, 'ao_session')
  if (!token) throw new AppError('UNAUTHENTICATED', 401)
  const rows = await db
    .select({
      userId: sessions.userId,
      workspaceId: sessions.workspaceId,
      role: memberships.role,
      disabled: users.disabled,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(
      memberships,
      and(
        eq(memberships.userId, sessions.userId),
        eq(memberships.workspaceId, sessions.workspaceId),
      ),
    )
    .where(
      and(
        eq(sessions.tokenHash, hash(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1)
  const row = rows[0]
  if (!row || row.disabled) throw new AppError('UNAUTHENTICATED', 401)
  c.set('principal', {
    userId: row.userId,
    workspaceId: row.workspaceId,
    role: row.role as Role,
    access: ['GET', 'HEAD'].includes(c.req.method) ? 'read' : 'write',
  })
  await next()
}
export const authRoutes = new Hono<Env>()
const loginSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(256),
    workspaceId: z.string().min(1).max(120),
  })
  .strict()
authRoutes.post('/login', async (c) => {
  const input = loginSchema.parse(await c.req.json())
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.trim().toLowerCase()),
  })
  const valid = user
    ? await Bun.password.verify(input.password, user.passwordHash)
    : await Bun.password.verify(
        input.password,
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      )
  const member = user
    ? await db.query.memberships.findFirst({
        where: and(
          eq(memberships.userId, user.id),
          eq(memberships.workspaceId, input.workspaceId),
        ),
      })
    : null
  if (!valid || !member || !user || user.disabled)
    throw new AppError('INVALID_CREDENTIALS', 401)
  const token = Buffer.from(
    crypto.getRandomValues(new Uint8Array(32)),
  ).toString('base64url')
  const expiresAt = new Date(Date.now() + 8 * 3600 * 1000)
  await db
    .insert(sessions)
    .values({
      tokenHash: hash(token),
      userId: user.id,
      workspaceId: member.workspaceId,
      expiresAt,
    })
  setCookie(c, 'ao_session', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 8 * 3600,
  })
  await audit(
    {
      userId: user.id,
      workspaceId: member.workspaceId,
      role: member.role as Role,
    },
    'session.login',
    user.id,
  )
  return c.json({
    userId: user.id,
    workspaceId: member.workspaceId,
    role: member.role,
    expiresAt,
  })
})
authRoutes.use('*', authenticate)
authRoutes.get('/me', (c) => c.json(c.get('principal')))
authRoutes.post('/logout', async (c) => {
  await db
    .delete(sessions)
    .where(eq(sessions.tokenHash, hash(getCookie(c, 'ao_session')!)))
  deleteCookie(c, 'ao_session', { path: '/' })
  return c.json({ ok: true })
})
