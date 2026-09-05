import { seoHead } from '../lib/seo'
import { createFileRoute, notFound } from '@tanstack/react-router'

import { TrendingRow } from '../components/project-views'
import { SiteFooter } from '../components/site-chrome'
import { getEcosystemData } from '../features/discovery/discovery.functions'

export const Route = createFileRoute('/$category/$ecosystem')({
  loader: async ({ params }) => {
    const data = await getEcosystemData({
      data: { category: params.category, ecosystem: params.ecosystem },
    })
    if (!data) throw notFound()
    return data
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          title:
            loaderData.facet.name +
            ' ' +
            loaderData.category.name +
            ' tools and frameworks',
          description:
            'Compare ' +
            loaderData.facet.name +
            ' tools for ' +
            loaderData.category.name.toLowerCase() +
            ': uses, pricing, open-source options, and documented tradeoffs.',
          path: '/' + loaderData.category.slug + '/' + loaderData.facet.slug,
          type: 'CollectionPage',
          noindex: loaderData.projects.length < 3,
          breadcrumbs: [
            { name: 'Home', path: '/' },
            {
              name: loaderData.category.name,
              path: '/' + loaderData.category.slug,
            },
            {
              name: loaderData.facet.name,
              path:
                '/' + loaderData.category.slug + '/' + loaderData.facet.slug,
            },
          ],
        })
      : { meta: [{ name: 'robots', content: 'noindex, follow' }] },
  component: EcosystemPage,
})

function EcosystemPage() {
  const data = Route.useLoaderData()
  const groups = [
    ['Trending', data.trending],
    ['Recommended', data.recommended],
    ['Worth watching', data.watching],
    ['Established', data.established],
  ] as const
  return (
    <>
      <main>
        <header
          className="category-hero shell"
          style={
            { '--category-accent': data.category.accent } as React.CSSProperties
          }
        >
          <p className="eyebrow">
            <a href={`/${data.category.slug}`}>{data.category.name}</a> ·{' '}
            {data.facet.kind}
          </p>
          <h1>{data.facet.name}</h1>
          <p className="lede">
            {data.facet.description ??
              `A curated ${data.facet.name} field guide.`}
          </p>
        </header>
        {groups.map(([title, projects]) =>
          projects.length ? (
            <section className="shell project-section" key={title}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{data.category.name}</p>
                  <h2>{title}</h2>
                </div>
                <p>{projects.length} reviewed projects</p>
              </div>
              <div className="trending-list">
                {projects.map((project, index) => (
                  <TrendingRow
                    project={project}
                    rank={index + 1}
                    key={project.id}
                  />
                ))}
              </div>
            </section>
          ) : null,
        )}
      </main>
      <SiteFooter />
    </>
  )
}
