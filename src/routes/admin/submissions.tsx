import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  moderationStatusSchema,
  moderationTransitions,
} from '../../features/contributions/model'
import type { ModerationStatus } from '../../features/contributions/model'
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
  errorComponent: () => (
    <main className="shell admin-page">
      <h1>Review dashboard unavailable</h1>
      <p>
        You need a verified account with editor or admin access. If you already
        have access, try again shortly.
      </p>
      <a href="/sign-in?next=%2Fadmin%2Fsubmissions">
        Sign in with an authorized account
      </a>
    </main>
  ),
})

function ReviewDate({ value }: { value: Date | string }) {
  const date = new Date(value)
  return (
    <time dateTime={date.toISOString()}>
      {date.toISOString().slice(0, 16).replace('T', ' ')} UTC
    </time>
  )
}

function ModerationControls({
  kind,
  id,
  currentStatus,
}: {
  kind: 'submission' | 'suggestion'
  id: string
  currentStatus: string
}) {
  const router = useRouter()
  const mutation = useMutation(orpc.contributions.moderate.mutationOptions())
  function change(status: ModerationStatus, form: HTMLFormElement) {
    if (!form.reportValidity()) return
    const reason = String(new FormData(form).get('reason'))
    mutation.mutate(
      { kind, id, status, reason },
      {
        onSuccess: async () => {
          form.reset()
          await router.invalidate()
        },
      },
    )
  }
  return (
    <form
      className="moderation-controls"
      onSubmit={(event) => event.preventDefault()}
    >
      <label>
        Decision note
        <textarea
          name="reason"
          minLength={8}
          maxLength={500}
          required
          rows={3}
          placeholder="Explain your decision to the contributor…"
        />
      </label>
      <div>
        {(moderationTransitions[currentStatus] ?? []).map((status) => (
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
      {mutation.error ? <p role="alert">{mutation.error.message}</p> : null}
    </form>
  )
}

function ModerationQueue() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('oldest')
  const [page, setPage] = useState(1)
  const filtered = data.submissions
    .filter(({ submission, submitterName, submitterEmail, categoryName }) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'pending'
          ? [
              'submitted',
              'under_review',
              'changes_requested',
              'approved',
            ].includes(submission.status)
          : submission.status === status)
      return (
        matchesStatus &&
        (category === 'all' || categoryName === category) &&
        [
          JSON.stringify(submission.payload),
          submission.repositoryUrl,
          submitterName,
          submitterEmail,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    })
    .sort(
      (a, b) =>
        (new Date(a.submission.createdAt).getTime() -
          new Date(b.submission.createdAt).getTime()) *
        (sort === 'oldest' ? 1 : -1),
    )
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10)
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
          <p>
            Review community projects, leave feedback, and prepare approved
            projects for publication.
          </p>
        </div>
      </header>
      <div className="review-summary" aria-label="Queue overview">
        {(
          [
            'submitted',
            'under_review',
            'changes_requested',
            'approved',
          ] as const
        ).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
          >
            <strong>
              {
                data.submissions.filter(
                  ({ submission }) => submission.status === value,
                ).length
              }
            </strong>
            <span>{value.replaceAll('_', ' ')}</span>
          </button>
        ))}
      </div>
      <nav className="review-links" aria-label="Review queues">
        <a href="#project-submissions">Projects ({data.submissions.length})</a>
        <a href="#edit-suggestions">
          Corrections (
          {
            data.suggestions.filter(
              ({ suggestion }) =>
                suggestion.status !== 'published' &&
                suggestion.status !== 'rejected',
            ).length
          }{' '}
          pending)
        </a>
        <a href="#abuse-reports">
          Reports (
          {data.reports.filter((report) => report.status === 'open').length}{' '}
          open)
        </a>
      </nav>
      <section className="moderation-list">
        <p role="alert">
          {draft.error?.message ||
            applied.error?.message ||
            resolve.error?.message}
        </p>
        <h2 id="project-submissions">Project submissions</h2>
        <p>
          Approval does not publish a project. Prepare its editorial draft,
          verify sources, then publish from the editor.
        </p>
        <div className="review-filters">
          <label>
            Search submissions
            <input
              type="search"
              value={search}
              placeholder="Project, repository, or contributor"
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
            >
              <option value="pending">Pending review / publication</option>
              <option value="all">All statuses</option>
              {moderationStatusSchema.options.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">All categories</option>
              {[
                ...new Set(
                  data.submissions
                    .map((entry) => entry.categoryName)
                    .filter((name): name is string => Boolean(name)),
                ),
              ]
                .sort()
                .map((name) => (
                  <option key={name}>{name}</option>
                ))}
            </select>
          </label>
          <label>
            Order
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
        <p role="status">
          {filtered.length} matching submissions · Page {currentPage} of {pages}
        </p>
        {!visible.length ? (
          <div className="review-empty">
            <h3>
              {data.submissions.length
                ? 'No matching submissions'
                : 'Your queue is clear'}
            </h3>
            <p>
              {data.submissions.length
                ? 'Try another search, category, or status.'
                : 'Projects submitted by the community will appear here.'}
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setSearch('')
                setCategory('all')
                setStatus('all')
                setPage(1)
              }}
            >
              Show all submissions
            </button>
          </div>
        ) : null}
        {visible.map(
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
                  <p className="review-date">
                    Submitted <ReviewDate value={submission.createdAt} />
                    <br />
                    Updated <ReviewDate value={submission.updatedAt} />
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
                    <ModerationControls
                      kind="submission"
                      id={submission.id}
                      currentStatus={submission.status}
                    />
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
                        <ReviewDate value={entry.createdAt} /> · {entry.action}:{' '}
                        {entry.reason}
                      </p>
                    ))}
                </details>
              </article>
            )
          },
        )}
        {pages > 1 ? (
          <nav className="review-links" aria-label="Submission pages">
            <button
              className="button secondary"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <button
              className="button secondary"
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </nav>
        ) : null}
        <h2 id="edit-suggestions">Edit suggestions</h2>
        {!data.suggestions.length ? <p>No corrections submitted yet.</p> : null}
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
                    <ModerationControls
                      kind="suggestion"
                      id={suggestion.id}
                      currentStatus={suggestion.status}
                    />
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
                            {
                              onSuccess: async () => {
                                await router.invalidate()
                              },
                            },
                          )
                        }}
                      >
                        <label>
                          Verified correction note
                          <textarea
                            name="reason"
                            minLength={8}
                            maxLength={500}
                            required
                          />
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
                        <ReviewDate value={entry.createdAt} /> · {entry.action}:{' '}
                        {entry.reason}
                      </p>
                    ))}
                </details>
              </article>
            )
          },
        )}
        <h2 id="abuse-reports">Abuse reports</h2>
        {!data.reports.length ? <p>No abuse reports.</p> : null}
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
                    {
                      onSuccess: async () => {
                        await router.invalidate()
                      },
                    },
                  )
                }}
              >
                <label>
                  Resolution note
                  <textarea
                    name="reason"
                    minLength={8}
                    maxLength={500}
                    required
                  />
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
