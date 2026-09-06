import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { getAccountData } from '../../features/contributions/contribution.functions'
import { authClient } from '../../lib/auth-client'
import { orpc } from '../../lib/orpc-client'

export const Route = createFileRoute('/account/')({
  loader: async () => {
    try {
      return await getAccountData()
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({ to: '/sign-in', search: { next: '/account' } })
    }
  },
  head: () => ({
    meta: [
      { title: 'Your account — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AccountPage,
})

function AccountPage() {
  const { contributor, activity, sessions } = Route.useLoaderData()
  const revoke = useMutation(orpc.contributions.revokeSession.mutationOptions())
  const profile = useMutation({
    mutationFn: async (name: string) => {
      const result = await authClient.updateUser({ name })
      if (result.error)
        throw new Error(
          result.error.message ?? 'Could not update your profile.',
        )
    },
    onSuccess: () => window.location.reload(),
  })
  return (
    <main className="shell account-page">
      <header className="account-heading">
        <div>
          <p className="eyebrow">Contributor account</p>
          <h1>{contributor.name}</h1>
          <p>{contributor.email}</p>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            void authClient.signOut({
              fetchOptions: { onSuccess: () => window.location.assign('/') },
            })
          }
        >
          <LogOut size={18} aria-hidden="true" /> Sign out
        </button>
      </header>
      <section className="admin-summary">
        <div>
          <strong>{activity.submissions.length}</strong>
          <span>Project submissions</span>
        </div>
        <div>
          <strong>{activity.suggestions.length}</strong>
          <span>Edit suggestions</span>
        </div>
        <div>
          <strong>
            {
              activity.submissions.filter((item) => item.status === 'published')
                .length
            }
          </strong>
          <span>Published</span>
        </div>
      </section>
      <div className="account-actions">
        <a className="button" href="/submit">
          Submit a project
        </a>
        <a className="button secondary" href="/account/submissions">
          View submission status
        </a>
      </div>
      <form
        className="account-profile"
        onSubmit={(event) => {
          event.preventDefault()
          profile.mutate(
            String(new FormData(event.currentTarget).get('name')).trim(),
          )
        }}
      >
        <label>
          Display name
          <input
            name="name"
            defaultValue={contributor.name}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <button className="button secondary" disabled={profile.isPending}>
          Save name
        </button>
        {profile.error ? <p role="alert">{profile.error.message}</p> : null}
      </form>
      <p>
        <a href="/admin">Editorial desk</a> · Restricted to authorized editors.
        Community accounts do not include publishing access.
      </p>
      <section className="account-sessions">
        <h2>Active sessions</h2>
        {revoke.error ? <p role="alert">{revoke.error.message}</p> : null}
        {sessions.map((item) => (
          <article key={item.id}>
            <div>
              <strong>
                {item.id === contributor.sessionId
                  ? 'Current session'
                  : 'Signed-in session'}
              </strong>
              <span>
                {item.userAgent ?? 'Unknown browser'} · expires{' '}
                {new Date(item.expiresAt).toLocaleDateString('en-US')}
              </span>
            </div>
            {item.id !== contributor.sessionId ? (
              <button
                className="button secondary"
                disabled={revoke.isPending}
                onClick={() =>
                  revoke.mutate(
                    { sessionId: item.id },
                    { onSuccess: () => window.location.reload() },
                  )
                }
              >
                Revoke
              </button>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  )
}
