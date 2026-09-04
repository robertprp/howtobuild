import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { toSupabasePoolerUrl } from '../src/db/connection-url'
import type { SupabasePoolerMode } from '../src/db/connection-url'

const poolerHost = process.argv[2]
const mode = (process.argv[3] ?? 'session') as SupabasePoolerMode

if (!poolerHost || !['session', 'transaction'].includes(mode)) {
  throw new Error(
    'Usage: pnpm db:use-pooler <region.pooler.supabase.com> [session|transaction]',
  )
}

const envPath = resolve(process.cwd(), '.env')
const source = await readFile(envPath, 'utf8')
const match = source.match(/^DATABASE_URL=(.+)$/m)

if (!match?.[1]) {
  throw new Error('DATABASE_URL was not found in .env')
}

const connectionString = toSupabasePoolerUrl(match[1], poolerHost, mode)
const updated = source.replace(
  /^DATABASE_URL=.+$/m,
  `DATABASE_URL=${connectionString}`,
)

await writeFile(envPath, updated, 'utf8')
console.log(
  `DATABASE_URL now uses the Supabase ${mode} pooler at ${poolerHost}.`,
)
