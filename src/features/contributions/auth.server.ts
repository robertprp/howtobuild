import { auth } from '../../lib/auth.server'

export type ContributorIdentity = {
  id: string
  email: string
  name: string
  sessionId: string
}

export async function requireContributor(
  request: Request,
): Promise<ContributorIdentity> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new Error('UNAUTHORIZED')
  if (!session.user.emailVerified) throw new Error('FORBIDDEN')
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    sessionId: session.session.id,
  }
}
