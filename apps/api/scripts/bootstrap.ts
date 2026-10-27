import { db } from '../src/db'
import {
  organizations,
  workspaces,
  users,
  memberships,
} from '../src/accessops/schema'
import { z } from 'zod'
const input = z
  .object({
    email: z.string().email(),
    password: z.string().min(14).max(256),
    organization: z.string().min(1),
    workspace: z.string().min(1),
  })
  .parse(JSON.parse(await Bun.stdin.text()))
const result = await db.transaction(async (tx) => {
  const orgId = Bun.randomUUIDv7(),
    workspaceId = Bun.randomUUIDv7(),
    userId = Bun.randomUUIDv7()
  await tx.insert(organizations).values({ id: orgId, name: input.organization })
  await tx
    .insert(workspaces)
    .values({ id: workspaceId, organizationId: orgId, name: input.workspace })
  await tx
    .insert(users)
    .values({
      id: userId,
      email: input.email.toLowerCase(),
      passwordHash: await Bun.password.hash(input.password, {
        algorithm: 'argon2id',
        memoryCost: 19456,
        timeCost: 2,
      }),
    })
  await tx.insert(memberships).values({ workspaceId, userId, role: 'admin' })
  return { orgId, workspaceId, userId, email: input.email }
})
console.log(JSON.stringify(result))
await db.$client.close()
