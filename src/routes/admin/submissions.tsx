import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getModerationData } from '../../features/contributions/contribution.functions'
import { orpc } from '../../lib/orpc-client'

export const Route = createFileRoute('/admin/submissions')({
  loader: async () => {
    try {
      return await getModerationData()
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({ to: '/sign-in', search: { next: '/admin/submissions' } })
    }
  },
  head: () => ({
    meta: [
      { title: 'Moderation queue — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ModerationQueue,
})

function ModerationControls({
  kind,
  id,
}: {
  kind: 'submission' | 'suggestion'
  id: string
}) {
  const mutation = useMutation(orpc.contributions.moderate.mutationOptions())
  function change(
    status: 'under_review' | 'changes_requested' | 'approved' | 'rejected',
    form: HTMLFormElement,
  ) {
    if (!form.reportValidity()) return
    const reason = String(new FormData(form).get('reason'))
    mutation.mutate(
      { kind, id, status, reason },
      { onSuccess: () => window.location.reload() },
    )
  }
  return (
    <form
      className="moderation-controls"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        Decision note
        <textarea name="reason" minLength={8} required rows={2} />
      </label>
      <div>
        {(
          ['under_review', 'changes_requested', 'approved', 'rejected'] as const
        ).map((status) => (
          <button
            className={status === 'approved' ? 'button' : 'button secondary'}
            type="button"
            disabled={mutation.isPending}
            onClick={(event) => change(status, event.currentTarget.form!)}
            key={status}
          >
            {status.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
      {mutation.error ? <p>{mutation.error.message}</p> : null}
    </form>
  )
}

function ModerationQueue() {
  const data = Route.useLoaderData()
  const draft = useMutation(orpc.contributions.prepareDraft.mutationOptions())
  const applied = useMutation(
    orpc.contributions.completeSuggestion.mutationOptions(),
  )
  const resolve = useMutation(orpc.contributions.resolveAbuse.mutationOptions())
  return (
    <main className="shell admin-page">
      <header className="admin-heading">
        <div>
          <a href="/admin">← Editorial desk</a>
          <p className="eyebrow">Community moderation</p>
          <h1>Submission queue</h1>
        </div>
      </header>
      <section className="moderation-list">
        <p role="alert">
          {draft.error?.message ||
            applied.error?.message ||
            resolve.error?.message}
        </p>
        <h2>Project submissions</h2>
        {data.submissions.map(
          ({ submission, submitterName, submitterEmail, categoryName }) => {
            const payload = submission.payload as {
              name?: string
              shortExplanation?: string
              whyInteresting?: string
              pricingInformation?: string
              openSourceInformation?: string
            }
            return (
              <article key={submission.id}>
                <header>
                  <span className={`status status-${submission.status}`}>
                    {submission.status.replaceAll('_', ' ')}
                  </span>
                  <h3>
                    {payload.name ??
                      `${submission.repositoryOwner}/${submission.repositoryName}`}
                  </h3>
                  <p>
                    {submitterName} · {submitterEmail} ·{' '}
                    {categoryName ?? 'Unknown category'}
                  </p>
                  <a href={submission.repositoryUrl}>
                    {submission.repositoryUrl}
                  </a>
                </header>
                <dl>
                  <div>
                    <dt>Explanation</dt>
                    <dd>{payload.shortExplanation}</dd>
                  </div>
                  <div>
                    <dt>Why interesting</dt>
                    <dd>{payload.whyInteresting}</dd>
                  </div>
                  <div>
                    <dt>Pricing</dt>
                    <dd>{payload.pricingInformation}</dd>
                  </div>
                  <div>
                    <dt>Open source</dt>
                    <dd>{payload.openSourceInformation}</dd>
                  </div>
                </dl>
                <div>
                  {submission.status !== 'published' ? (
                    <ModerationControls kind="submission" id={submission.id} />
                  ) : null}
                  {submission.status === 'approved' ? (
                    <button
                      className="button"
                      disabled={draft.isPending}
                      onClick={() =>
                        draft.mutate(
                          { id: submission.id },
                          {
                            onSuccess: (result) =>
                              window.location.assign(
                                `/admin/projects/${result.slug}`,
                              ),
                          },
                        )
                      }
                    >
                      {submission.projectId
                        ? 'Open editorial draft'
                        : 'Prepare editorial draft'}
                    </button>
                  ) : null}
                </div>
                <details className="contribution-history">
                  <summary>Full submission and review history</summary>
                  <pre>{JSON.stringify(submission.payload, null, 2)}</pre>
                  {data.events
                    .filter((entry) => entry.submissionId === submission.id)
                    .map((entry) => (
                      <p key={entry.id}>
                        {entry.action}: {entry.reason}
                      </p>
                    ))}
                </details>
              </article>
            )
          },
        )}
        <h2>Edit suggestions</h2>
        {data.suggestions.map(
          ({ suggestion, submitterName, projectName, projectSlug }) => {
            const payload = suggestion.payload as {
              summary?: string
              proposedChanges?: string
              sourceUrl?: string
            }
            return (
              <article key={suggestion.id}>
                <header>
                  <span className={`status status-${suggestion.status}`}>
                    {suggestion.status.replaceAll('_', ' ')}
                  </span>
                  <h3>
                    <a href={`/projects/${projectSlug}`}>{projectName}</a>
                  </h3>
                  <p>Suggested by {submitterName}</p>
                </header>
                <dl>
                  <div>
                    <dt>Summary</dt>
                    <dd>{payload.summary}</dd>
                  </div>
                  <div>
                    <dt>Proposed change</dt>
                    <dd>{payload.proposedChanges}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>
                      <a href={payload.sourceUrl}>{payload.sourceUrl}</a>
                    </dd>
                  </div>
                </dl>
                <div>
                  {suggestion.status !== 'published' ? (
                    <ModerationControls kind="suggestion" id={suggestion.id} />
                  ) : null}
                  {suggestion.status === 'approved' ? (
                    <>
                      <a
                        className="text-link"
                        href={`/admin/projects/${projectSlug}`}
                      >
                        Edit the project →
                      </a>
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          applied.mutate(
                            {
                              id: suggestion.id,
                              reason: String(
                                new FormData(event.currentTarget).get('reason'),
                              ),
                            },
                            { onSuccess: () => window.location.reload() },
                          )
                        }}
                      >
                        <label>
                          Verified correction note
                          <textarea name="reason" minLength={8} required />
                        </label>
                        <button className="button" disabled={applied.isPending}>
                          Mark correction applied
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
                <details className="contribution-history">
                  <summary>Review history</summary>
                  {data.events
                    .filter((entry) => entry.editSuggestionId === suggestion.id)
                    .map((entry) => (
                      <p key={entry.id}>
                        {entry.action}: {entry.reason}
                      </p>
                    ))}
                </details>
              </article>
            )
          },
        )}
        <h2>Abuse reports</h2>
        {data.reports.map((report) => (
          <article key={report.id}>
            <header>
              <span className={`status status-${report.status}`}>
                {report.status}
              </span>
              <h3>{report.reason}</h3>
              <p>{report.pageUrl}</p>
            </header>
            <p>{report.details}</p>
            {report.status === 'open' ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  resolve.mutate(
                    {
                      id: report.id,
                      reason: String(
                        new FormData(event.currentTarget).get('reason'),
                      ),
                    },
                    { onSuccess: () => window.location.reload() },
                  )
                }}
              >
                <label>
                  Resolution note
                  <textarea name="reason" minLength={8} required />
                </label>
                <button className="button" disabled={resolve.isPending}>
                  Resolve report
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  )
}
