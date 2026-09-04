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
      ? {
          meta: [
            {
              title: `${loaderData.category.name} developer tools — HowToBuild.dev`,
            },
            { name: 'description', content: loaderData.category.description },
          ],
          links: [
            {
              rel: 'canonical',
              href: `https://howtobuild.dev/${loaderData.category.slug}`,
            },
          ],
        }
      : {},
  component: CategoryPage,
})

function CategoryPage() {
  const { category, projects } = Route.useLoaderData()
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
            cost, and documented tradeoffs. Automated momentum will be shown
            separately when enough history exists.
          </p>
        </section>
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
