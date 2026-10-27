import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const client = new SQL(databaseUrl, {
  max: 10,
  idleTimeout: 20,
  connectionTimeout: 5,
  maxLifetime: 1800,
  connection: { statement_timeout: 15000, lock_timeout: 5000 },
})
export const db = drizzle({ client, schema })
