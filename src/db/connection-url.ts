export type SupabasePoolerMode = 'session' | 'transaction'

const DIRECT_SUPABASE_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/
const POOLER_SUPABASE_HOST =
  /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.pooler\.supabase\.com$/

export function toSupabasePoolerUrl(
  connectionString: string,
  poolerHost: string,
  mode: SupabasePoolerMode = 'session',
) {
  const url = new URL(connectionString)

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the postgres protocol')
  }

  const projectReference =
    url.hostname.match(DIRECT_SUPABASE_HOST)?.[1] ??
    url.username.match(/^postgres\.([a-z0-9]+)$/)?.[1]

  if (!projectReference) {
    throw new Error(
      'DATABASE_URL is not a Supabase direct or pooler connection string',
    )
  }

  if (!POOLER_SUPABASE_HOST.test(poolerHost)) {
    throw new Error('The pooler host must end in .pooler.supabase.com')
  }

  url.username = `postgres.${projectReference}`
  url.hostname = poolerHost
  url.port = mode === 'transaction' ? '6543' : '5432'
  // Opt in to standard libpq semantics: `require` encrypts the connection
  // without depending on a local CA bundle for Supabase's pooler certificate.
  url.searchParams.set('sslmode', 'require')
  url.searchParams.set('uselibpqcompat', 'true')

  return url.toString()
}
