import { createFileRoute, redirect } from '@tanstack/react-router'
import { getOperationsData } from '../../features/operations/operations.functions'

export const Route = createFileRoute('/admin/operations')({
  loader: async () => {
    try {
      return await getOperationsData()
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED')
        throw redirect({
          to: '/sign-in',
          search: { next: '/admin/operations' },
        })
      throw error
    }
  },
  head: () => ({
    meta: [
      { title: 'Operations — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: OperationsPage,
})

function dateLabel(value: string | null) {
  return value
    ? `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))} UTC`
    : 'Never / unavailable'
}

function OperationsPage() {
  const data = Route.useLoaderData()
  return (
    <main className="admin-page shell">
      <p>
        <a href="/admin/links">Review monitored links →</a>
      </p>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Phase 5 · Operations</p>
          <h1>Keep the field guide healthy.</h1>
          <p>
            Snapshot:{' '}
            <time dateTime={data.generatedAt}>
              {dateLabel(data.generatedAt)}
            </time>
            . Reload to refresh.
          </p>
        </div>
        <a href="/admin" className="button secondary">
          Editorial desk
        </a>
      </header>
      <section className="admin-summary" aria-label="Operations summary">
        <div>
          <strong>{data.published}</strong>
          <span>Published projects</span>
        </div>
        <div>
          <strong>{data.reviewQueue.length}</strong>
          <span>Projects needing review</span>
        </div>
        <div>
          <strong>
            {data.metrics.healthyPercent === null
              ? 'N/A'
              : `${data.metrics.healthyPercent}%`}
          </strong>
          <span>Active repositories healthy · target 95%</span>
        </div>
      </section>
      <section className="operations-grid" aria-label="Operational queues">
        <article className="operations-panel">
          <h2>GitHub freshness</h2>
          <p>
            {data.metrics.meetsTarget === null
              ? 'No active linked repositories to evaluate.'
              : data.metrics.meetsTarget
                ? 'The freshness target is met in this snapshot.'
                : 'The freshness target is not met. Inspect collection failures and stale data.'}
          </p>
          <dl>
            <div>
              <dt>Healthy</dt>
              <dd>{data.metrics.healthy}</dd>
            </div>
            <div>
              <dt>Delayed</dt>
              <dd>{data.metrics.delayed}</dd>
            </div>
            <div>
              <dt>Stale / never collected</dt>
              <dd>{data.metrics.stale}</dd>
            </div>
            <div>
              <dt>Disabled / excluded</dt>
              <dd>{data.metrics.disabled}</dd>
            </div>
          </dl>
          <p>
            Unique repositories linked to published projects. Disabled
            repositories are excluded from the percentage; this measures
            freshness, not ranking confidence.
          </p>
          <a href="/admin/metrics">Inspect metric health →</a>
        </article>
        <article className="operations-panel">
          <h2>Community response</h2>
          <dl>
            <div>
              <dt>Submissions awaiting editors</dt>
              <dd>{data.moderation.submissions}</dd>
            </div>
            <div>
              <dt>Edit suggestions awaiting editors</dt>
              <dd>{data.moderation.suggestions}</dd>
            </div>
            <div>
              <dt>Waiting at least 3 days since submission</dt>
              <dd>{data.moderation.overdue}</dd>
            </div>
            <div>
              <dt>Open abuse reports</dt>
              <dd>{data.moderation.openReports}</dd>
            </div>
          </dl>
          <p>
            Oldest waiting item: {dateLabel(data.moderation.oldestAt)}. Includes
            submitted and under-review items; excludes items awaiting
            contributor changes.
          </p>
          <a href="/admin/submissions">Open moderation queue →</a>
        </article>
      </section>
      <section
        aria-labelledby="review-queue-heading"
        className="operations-reviews"
      >
        <h2 id="review-queue-heading">Editorial review reminders</h2>
        <p>
          Review pricing, licenses, sources, and links every {data.reviewDays}{' '}
          days. These reminders use stored source dates and the last publication
          review; they do not prove that a pricing or license claim was
          verified. Missing evidence and incomplete content need manual
          attention.
        </p>
        {data.reviewQueue.length ? (
          <ul className="operations-review-list">
            {data.reviewQueue.map((project) => (
              <li key={project.slug}>
                <h3>
                  <a href={`/admin/projects/${project.slug}`}>{project.name}</a>
                </h3>
                <ul>
                  {project.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p>
                  Publication review: {dateLabel(project.reviewedAt)} · Oldest
                  source check: {dateLabel(project.oldestSourceAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            No reminders in this snapshot. Manual claim verification and launch
            audits are still required.
          </p>
        )}
      </section>
    </main>
  )
}
