import { and, eq, gt } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import { editorInvites, editorRoles } from '../../db/schema'
import { auth } from '../../lib/auth.server'
import { canEditRole } from './model'

export type EditorIdentity = {
  id: string
  email: string
  name: string
  role: 'editor' | 'admin'
}

export async function requireEditor(request: Request): Promise<EditorIdentity> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new Error('UNAUTHORIZED')

  const db = getDb()
  const directRole = await db.query.editorRoles.findFirst({
    where: eq(editorRoles.userId, session.user.id),
  })

  let role = directRole?.role
  if (!canEditRole(role)) {
    const email = session.user.email.trim().toLowerCase()
    const invite = await db.query.editorInvites.findFirst({
      where: and(
        eq(editorInvites.email, email),
        gt(editorInvites.expiresAt, new Date()),
      ),
    })
    if (!invite || invite.acceptedAt) throw new Error('FORBIDDEN')

    await db.transaction(async (tx) => {
      await tx
        .insert(editorRoles)
        .values({ userId: session.user.id, role: invite.role })
        .onConflictDoNothing()
      await tx
        .update(editorInvites)
        .set({ acceptedAt: new Date() })
        .where(eq(editorInvites.id, invite.id))
    })
    role = invite.role
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: role as 'editor' | 'admin',
  }
}
