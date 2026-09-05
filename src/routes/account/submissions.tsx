import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAccountData } from '../../features/contributions/contribution.functions'
import { ContributionResponse } from '../../components/contribution-response'

export const Route = createFileRoute('/account/submissions')({
  loader: async () => {
    try {
      return await getAccountData()
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({
        to: '/sign-in',
        search: { next: '/account/submissions' },
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'Submission status — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SubmissionStatus,
})

function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      {value.replaceAll('_', ' ')}
    </span>
  )
}
function SubmissionStatus() {
  const { activity } = Route.useLoaderData()
  return (
    <main className="shell account-page">
      <header>
        <a href="/account">← Account</a>
        <p className="eyebrow">Contribution history</p>
        <h1>Submission status</h1>
      </header>
      <section className="contribution-list">
        <h2>Projects</h2>
        {activity.submissions.length ? (
          activity.submissions.map((item) => {
            const payload = item.payload as { name?: string }
            return (
              <article key={item.id}>
                <div>
                  <Status value={item.status} />
                  <h3>
                    {payload.name ??
                      `${item.repositoryOwner}/${item.repositoryName}`}
                  </h3>
                  <a href={item.repositoryUrl}>{item.repositoryUrl}</a>
                </div>
                <p>
                  {item.moderationReason ??
                    'The editorial team has not left a moderation note.'}
                </p>
                <time>
                  {new Date(item.createdAt).toLocaleDateString('en-US')}
                </time>
                {item.status === 'changes_requested' ? (
                  <ContributionResponse kind="submission" id={item.id} />
                ) : null}
                <details className="contribution-history">
                  <summary>Review history</summary>
                  {activity.events
                    .filter((entry) => entry.submissionId === item.id)
                    .map((entry) => (
                      <p key={entry.id}>{entry.reason}</p>
                    ))}
                </details>
              </article>
            )
          })
        ) : (
          <p>No project submissions yet.</p>
        )}
        <h2>Edit suggestions</h2>
        {activity.suggestions.length ? (
          activity.suggestions.map(
            ({ suggestion, projectName, projectSlug }) => (
              <article key={suggestion.id}>
                <div>
                  <Status value={suggestion.status} />
                  <h3>
                    <a href={`/projects/${projectSlug}`}>{projectName}</a>
                  </h3>
                </div>
                <p>
                  {suggestion.moderationReason ??
                    'The editorial team has not left a moderation note.'}
                </p>
                <time>
                  {new Date(suggestion.createdAt).toLocaleDateString('en-US')}
                </time>
                {suggestion.status === 'changes_requested' ? (
                  <ContributionResponse kind="suggestion" id={suggestion.id} />
                ) : null}
                <details className="contribution-history">
                  <summary>Review history</summary>
                  {activity.events
                    .filter((entry) => entry.editSuggestionId === suggestion.id)
                    .map((entry) => (
                      <p key={entry.id}>{entry.reason}</p>
                    ))}
                </details>
              </article>
            ),
          )
        ) : (
          <p>No edit suggestions yet.</p>
        )}
      </section>
    </main>
  )
}
