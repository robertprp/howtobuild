import { editorInvites } from '../src/db/schema'
import { getDb, getPool } from '../src/db/client.server'

const email = process.argv[2]?.trim().toLowerCase()
const role = process.argv[3] === 'admin' ? 'admin' : 'editor'

if (!email || !email.includes('@')) {
  console.error('Usage: pnpm editor:invite editor@example.com [editor|admin]')
  process.exitCode = 1
} else {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000)
  const [invite] = await getDb()
    .insert(editorInvites)
    .values({ email, role, expiresAt })
    .onConflictDoUpdate({
      target: editorInvites.email,
      set: { role, expiresAt, acceptedAt: null, invitedAt: new Date() },
    })
    .returning()
  console.log(
    `Invited ${invite.email} as ${invite.role} until ${expiresAt.toISOString()}`,
  )
}

await getPool().end()
