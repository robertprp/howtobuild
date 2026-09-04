import { createFileRoute } from '@tanstack/react-router'

import { TrendingRow } from '../components/project-views'
import { SiteFooter } from '../components/site-chrome'
import { StackCard } from '../components/stack-views'
import { getSearchData } from '../features/discovery/discovery.functions'

type SearchState = {
  q: string
  category?: string
  facet?: string
  type?: string
  pricing?: string
  openSource?: boolean
  selfHostable?: boolean
}

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): SearchState => ({
    q: typeof search.q === 'string' ? search.q.slice(0, 120) : '',
    category: typeof search.category === 'string' ? search.category : undefined,
    facet: typeof search.facet === 'string' ? search.facet : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
    pricing: typeof search.pricing === 'string' ? search.pricing : undefined,
    openSource: search.openSource === 'true' ? true : undefined,
    selfHostable: search.selfHostable === 'true' ? true : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    getSearchData({
      data: {
        query: deps.q,
        filters: {
          category: deps.category,
          facet: deps.facet,
          type: deps.type,
          pricing: deps.pricing,
          openSource: deps.openSource,
          selfHostable: deps.selfHostable,
        },
      },
    }),
  head: () => ({
    meta: [
      { title: 'Search developer tools — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, follow' },
    ],
    links: [{ rel: 'canonical', href: 'https://howtobuild.dev/search' }],
  }),
  component: SearchPage,
})

function SearchPage() {
  const data = Route.useLoaderData()
  return (
    <>
      <main className="shell discovery-page">
        <header className="discovery-heading">
          <p className="eyebrow">Search the field guide</p>
          <h1>Find the right tool for the job.</h1>
        </header>
        <form className="search-form" method="get" role="search">
          <label className="search-input">
            Search projects, stacks, categories, and ecosystems
            <input name="q" type="search" defaultValue={data.query} autoFocus />
          </label>
          <label>
            Category
            <select name="category" defaultValue={data.filters.category ?? ''}>
              <option value="">All categories</option>
              {data.filterOptions.categories.map((category) => (
                <option value={category.slug} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Language or ecosystem
            <select name="facet" defaultValue={data.filters.facet ?? ''}>
              <option value="">All ecosystems</option>
              {data.filterOptions.facets.map((facet) => (
                <option value={facet.slug} key={facet.id}>
                  {facet.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              name="openSource"
              value="true"
              defaultChecked={data.filters.openSource}
            />
            Open source
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              name="selfHostable"
              value="true"
              defaultChecked={data.filters.selfHostable}
            />
            Self-hostable
          </label>
          <button className="button" type="submit">
            Search
          </button>
        </form>

        {data.categories.length || data.facets.length ? (
          <section
            className="landing-results"
            aria-labelledby="landing-results"
          >
            <p className="eyebrow" id="landing-results">
              Permanent guides
            </p>
            {[
              ...data.categories.map((item) => ({
                key: `category-${item.id}`,
                href: `/${item.slug}`,
                type: 'Category',
                name: item.name,
                description: item.description,
              })),
              ...data.facets.map((item) => ({
                key: `facet-${item.id}`,
                href: item.categorySlug
                  ? `/${item.categorySlug}/${item.slug}`
                  : `/search?facet=${item.slug}`,
                type: item.kind,
                name: item.name,
                description:
                  item.description ?? `Explore ${item.name} projects.`,
              })),
            ].map((item) => (
              <a href={item.href} key={item.key}>
                <span className="eyebrow">{item.type}</span>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </a>
            ))}
          </section>
        ) : null}

        {data.stacks.length ? (
          <section className="project-section" aria-labelledby="stack-results">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Stack results</p>
                <h2 id="stack-results">Complete starting points</h2>
              </div>
            </div>
            <div className="stack-directory compact">
              {data.stacks.map((stack) => (
                <StackCard stack={stack} key={stack.id} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="project-section" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Project results</p>
              <h2>
                {data.query
                  ? `Results for “${data.query}”`
                  : 'Browse the catalog'}
              </h2>
            </div>
            <p>{data.projects.length} matches</p>
          </div>
          {data.projects.length ? (
            <div className="trending-list">
              {data.projects.map((project, index) => (
                <TrendingRow
                  project={project}
                  rank={index + 1}
                  key={project.id}
                />
              ))}
            </div>
          ) : data.stacks.length ||
            data.categories.length ||
            data.facets.length ? null : (
            <div className="empty-state">
              <h3>No reviewed match yet.</h3>
              <p>
                Try a broader responsibility, project name, or ecosystem. This
                query was counted anonymously so the editorial team can improve
                coverage.
              </p>
              <a href="/search" className="button secondary">
                Clear search
              </a>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
