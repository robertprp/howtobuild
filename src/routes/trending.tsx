import { seoHead } from '../lib/seo'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'

import { TrendingRow } from '../components/project-views'
import { SiteFooter } from '../components/site-chrome'
import { getTrendingData } from '../features/discovery/discovery.functions'
import { periodLabel } from '../features/github/period'
import type { TrendingPeriod } from '../features/github/period'

type TrendingSearch = { period: TrendingPeriod; category?: string }

export const Route = createFileRoute('/trending')({
  search: { middlewares: [stripSearchParams({ period: 'week' })] },
  validateSearch: (search: Record<string, unknown>): TrendingSearch => ({
    period:
      search.period === 'seven-weeks'
        ? 'seven-weeks'
        : search.period === 'month'
          ? 'month'
          : 'week',
    category: typeof search.category === 'string' ? search.category : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getTrendingData({
      data: { period: deps.period, filters: { category: deps.category } },
    }),
  head: ({ loaderData }) =>
    seoHead({
      title:
        'Trending GitHub projects: ' +
        periodLabel[loaderData?.period ?? 'week'],
      description:
        'Discover developer tools ranked by observed GitHub star growth over 7, 30, or 49 days. Compare uses and costs before choosing a tool.',
      path:
        loaderData && loaderData.period !== 'week'
          ? '/trending?period=' + loaderData.period
          : '/trending',
      type: 'CollectionPage',
      noindex: Boolean(loaderData?.filters.category),
    }),
  component: TrendingPage,
})

function TrendingPage() {
  const data = Route.useLoaderData()
  return (
    <>
      <main className="shell discovery-page">
        <header className="discovery-heading">
          <p className="eyebrow">Measured momentum</p>
          <h1>Most stars gained.</h1>
          <p className="lede">
            {periodLabel[data.period]}, ranked by net new GitHub stars among
            projects in our catalog. Each result shows its actual observation
            dates. Anomalous and stale repositories are excluded.
          </p>
        </header>
        <form className="trend-controls" method="get">
          <fieldset>
            <legend>Observation period</legend>
            <label>
              <input
                type="radio"
                name="period"
                value="week"
                defaultChecked={data.period === 'week'}
              />{' '}
              This week
            </label>
            <label>
              <input
                type="radio"
                name="period"
                value="seven-weeks"
                defaultChecked={data.period === 'seven-weeks'}
              />
              Last 7 weeks
            </label>
            <label>
              <input
                type="radio"
                name="period"
                value="month"
                defaultChecked={data.period === 'month'}
              />{' '}
              This month
            </label>
          </fieldset>
          <label>
            Category
            <select name="category" defaultValue={data.filters.category ?? ''}>
              <option value="">All categories</option>
              {data.categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit">
            Apply
          </button>
        </form>
        <section className="project-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Eligible rankings</p>
              <h2>The current movement.</h2>
            </div>
            <p>{data.projects.length} complete enough to rank</p>
          </div>
          {data.projects.length ? (
            <div className="trending-list">
              {data.projects.map((project, index) => (
                <TrendingRow
                  key={project.id}
                  project={project}
                  rank={index + 1}
                  period={data.period}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No complete window yet.</h3>
              <p>
                The collector will publish rankings only after enough real
                observations exist.
              </p>
            </div>
          )}
        </section>
        {data.earlySignals.length ? (
          <section className="early-signals">
            <p className="eyebrow">Early signals</p>
            <h2>History still forming.</h2>
            <p>These projects are visible without an extrapolated rank.</p>
            <div className="trending-list">
              {data.earlySignals.map((project) => (
                <TrendingRow
                  key={project.id}
                  project={project}
                  period={data.period}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  )
}
