import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'

const globalForDb = globalThis as typeof globalThis & {
  howToBuildPool?: Pool
}

function createPool() {
  // A non-routable local default lets build-time route discovery load the auth
  // configuration without opening a connection. Runtime checks still fail fast.
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://phase_zero:phase_zero@127.0.0.1:5432/phase_zero'

  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    ssl: connectionString.includes('localhost')
      ? undefined
      : { rejectUnauthorized: false },
  })
}

export function getPool() {
  globalForDb.howToBuildPool ??= createPool()
  return globalForDb.howToBuildPool
}

export function getDb() {
  return drizzle(getPool(), { schema })
}

export async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  const result = await getPool().query<{ now: Date; database: string }>(
    'select now() as now, current_database() as database',
  )

  return result.rows[0]
}
