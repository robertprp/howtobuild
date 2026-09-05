import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { getMetricsData } from '../../features/editorial/catalog.functions'
import { orpc } from '../../lib/orpc-client'

export const Route = createFileRoute('/admin/metrics')({
  loader: async () => {
    try {
      return await getMetricsData()
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({ to: '/sign-in', search: { next: '/admin/metrics' } })
    }
  },
  head: () => ({
    meta: [
      { title: 'Metric health — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: MetricsPage,
})

function ExclusionControl({
  repositoryId,
  excluded,
}: {
  repositoryId: string
  excluded: boolean
}) {
  const [message, setMessage] = useState('')
  const mutation = useMutation(
    orpc.metrics.setRepositoryExclusion.mutationOptions(),
  )
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        mutation.mutate(
          {
            repositoryId,
            excluded: !excluded,
            reason: String(form.get('reason') ?? ''),
          },
          {
            onSuccess: () => window.location.reload(),
            onError: (error) => setMessage(error.message),
          },
        )
      }}
    >
      <label>
        Editorial reason
        <input
          name="reason"
          required
          minLength={8}
          placeholder={
            excluded
              ? 'Why is it safe to include?'
              : 'Why should automatic ranking stop?'
          }
        />
      </label>
      <button
        className="button secondary"
        disabled={mutation.isPending}
        type="submit"
      >
        {excluded ? 'Return to ranking' : 'Exclude from ranking'}
      </button>
      {message ? (
        <p className="form-message" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  )
}

function MetricsPage() {
  const { repositories } = Route.useLoaderData()
  return (
    <main className="admin-page shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Metric health.</h1>
          <p className="lede">
            Stale, disabled, and anomalous repositories cannot enter automatic
            trending placements.
          </p>
        </div>
        <a href="/admin" className="button secondary">
          Editorial desk
        </a>
      </header>
      <section className="metric-health-list">
        {repositories.map((item) => (
          <article key={item.repository.id}>
            <div>
              <span className={`status status-${item.health}`}>
                {item.health}
              </span>
              <h2>
                {item.projectName ??
                  `${item.repository.owner}/${item.repository.name}`}
              </h2>
              <p>
                {item.repository.owner}/{item.repository.name} ·{' '}
                {item.snapshotCount} snapshots
              </p>
            </div>
            <dl>
              <div>
                <dt>Last healthy sync</dt>
                <dd>
                  {item.repository.lastSyncedAt
                    ? new Date(item.repository.lastSyncedAt).toLocaleString(
                        'en-US',
                      )
                    : 'Never'}
                </dd>
              </div>
              <div>
                <dt>Failures</dt>
                <dd>{item.repository.consecutiveFailures}</dd>
              </div>
              <div>
                <dt>Last error</dt>
                <dd>{item.repository.lastError ?? 'None'}</dd>
              </div>
            </dl>
            <ExclusionControl
              repositoryId={item.repository.id}
              excluded={item.repository.manuallyExcluded}
            />
          </article>
        ))}
      </section>
    </main>
  )
}
