import { seoHead } from '../lib/seo'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { EditorialFeature, TrendingRow } from '../components/project-views'
import { SiteFooter } from '../components/site-chrome'
import { getCategoryData } from '../features/editorial/catalog.functions'

export const Route = createFileRoute('/$category')({
  loader: async ({ params }) => {
    const data = await getCategoryData({ data: { slug: params.category } })
    if (!data) throw notFound()
    return data
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          title:
            loaderData.category.name +
            ' tools and frameworks for your tech stack',
          description: loaderData.category.description,
          path: '/' + loaderData.category.slug,
          type: 'CollectionPage',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            {
              name: loaderData.category.name,
              path: '/' + loaderData.category.slug,
            },
          ],
        })
      : { meta: [{ name: 'robots', content: 'noindex, follow' }] },
  component: CategoryPage,
})

function CategoryPage() {
  const { category, projects } = Route.useLoaderData()
  const categoryFacets = Array.from(
    new Map(
      projects.flatMap((project) =>
        project.facets.map((facet) => [`${facet.kind}-${facet.slug}`, facet]),
      ),
    ).values(),
  )
  const trending = projects
    .filter(
      (project) =>
        project.momentum != null &&
        project.momentum.score !== null &&
        !['stale', 'disabled'].includes(project.momentum.health) &&
        !project.momentum.anomaly,
    )
    .sort((a, b) => (b.momentum?.score ?? 0) - (a.momentum?.score ?? 0))
  return (
    <>
      <main>
        <header
          className="category-hero shell"
          style={
            { '--category-accent': category.accent } as React.CSSProperties
          }
        >
          <p className="eyebrow">Field 0{category.sortOrder}</p>
          <h1>{category.name}</h1>
          <p className="lede">{category.description}</p>
        </header>
        <section className="shell category-summary">
          <div>
            <p className="eyebrow">How we read this field</p>
            <h2>Useful first. Fashion second.</h2>
          </div>
          <p>
            Recommendations balance technical fit, maintainability, operating
            cost, and documented tradeoffs. Momentum uses separate, versioned
            GitHub evidence when enough history exists.
          </p>
        </section>
        {categoryFacets.length ? (
          <nav
            className="shell ecosystem-links"
            aria-label={`${category.name} languages and ecosystems`}
          >
            {categoryFacets.map((facet) => (
              <a
                href={`/${category.slug}/${facet.slug}`}
                key={`${facet.kind}-${facet.slug}`}
              >
                <span>{facet.kind}</span>
                <strong>{facet.name}</strong>
              </a>
            ))}
          </nav>
        ) : null}
        {trending.length ? (
          <section className="shell project-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Measured momentum</p>
                <h2>Trending in {category.name}.</h2>
              </div>
            </div>
            <div className="trending-list">
              {trending.slice(0, 6).map((project, index) => (
                <TrendingRow
                  project={project}
                  rank={index + 1}
                  key={project.id}
                />
              ))}
            </div>
          </section>
        ) : null}
        {projects[0] ? (
          <section className="shell feature-section">
            <EditorialFeature project={projects[0]} />
          </section>
        ) : null}
        <section className="shell project-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">All published projects</p>
              <h2>The {category.name.toLowerCase()} shortlist.</h2>
            </div>
            <p>{projects.length} reviewed entries</p>
          </div>
          <div className="trending-list">
            {projects.map((project, index) => (
              <TrendingRow
                key={project.id}
                project={project}
                rank={index + 1}
              />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
