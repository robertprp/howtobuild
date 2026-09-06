import { eq, sql } from 'drizzle-orm'
import { getDb, getPool } from '../src/db/client.server'
import { editorRoles, user } from '../src/db/schema'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const usage =
  'Usage: pnpm admin:grant --email person@example.com OR pnpm admin:grant --user-id ACCOUNT_ID'

async function main() {
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage)
    return
  }
  const selector = args[0]
  const rawValue = args.at(1)
  const value = rawValue?.trim()
  if (
    args.length !== 2 ||
    !['--email', '--user-id'].includes(selector) ||
    !value
  ) {
    throw new Error(usage)
  }
  if (selector === '--email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error('Provide a valid email address.')
  }
  if (!process.env.DATABASE_URL)
    throw new Error(
      'DATABASE_URL must point to your existing application database.',
    )

  try {
    const grantedAccount = await getDb().transaction(async (tx) => {
      const matches = await tx
        .select()
        .from(user)
        .where(
          selector === '--email'
            ? sql`lower(${user.email}) = ${value.toLowerCase()}`
            : eq(user.id, value),
        )
        .for('update')
      if (matches.length !== 1)
        throw new Error(
          'Expected exactly one existing account. Ask the user to register first, or use --user-id to select the account precisely.',
        )
      const account = matches[0]
      if (!account.emailVerified)
        throw new Error(
          'The account must verify its email before receiving admin access.',
        )
      await tx
        .insert(editorRoles)
        .values({ userId: account.id, role: 'admin' })
        .onConflictDoUpdate({
          target: editorRoles.userId,
          set: { role: 'admin', grantedBy: null, grantedAt: new Date() },
        })
      return account
    })
    console.log(
      `Admin access granted to ${grantedAccount.email} (account ${grantedAccount.id}). Open /admin/submissions while signed in as this account.`,
    )
  } finally {
    await getPool().end()
  }
}

main().catch((error: unknown) => {
  // Do not print database errors: drivers may include connection details.
  const message = error instanceof Error ? error.message : ''
  const safe = [
    usage,
    'Provide a valid email',
    'DATABASE_URL must',
    'Expected exactly one',
    'The account must',
  ]
  console.error(
    safe.some((prefix) => message.startsWith(prefix))
      ? message
      : 'Admin grant failed. Check database connectivity and that existing migrations have been applied.',
  )
  process.exitCode = 1
})
