import { createFileRoute } from '@tanstack/react-router'

import {
  EditorialFeature,
  StackItemExample,
  TrendingRow,
} from '../components/project-views'
import { SiteFooter } from '../components/site-chrome'
import { getHomeData } from '../features/editorial/catalog.functions'
import type { PublicProject } from '../features/editorial/model'

export const Route = createFileRoute('/')({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: 'HowToBuild.dev — A field guide to modern developer tools' },
      {
        name: 'description',
        content:
          'Curated frameworks, tools, AI products, and practical editorial guidance for modern software development.',
      },
      {
        property: 'og:title',
        content: 'HowToBuild.dev — Discover what developers build with now',
      },
      {
        property: 'og:description',
        content:
          'An independent, sourced field guide to modern developer tools.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://howtobuild.dev/' }],
  }),
  component: Home,
})

function Home() {
  const data = Route.useLoaderData()
  const lead: PublicProject | undefined =
    data.featured.at(0) ?? data.latest.at(0)

  return (
    <>
      <main>
        <section className="home-hero shell">
          <p className="eyebrow">Independent developer field guide · 2026</p>
          <h1>Discover what developers are building with now.</h1>
          <p className="lede">
            Curated frameworks, tools, AI products, and production-minded
            guidance—with sources, costs, and tradeoffs in view.
          </p>
          <div className="hero-actions">
            <a className="button" href="#projects">
              Browse the edit
            </a>
            <a className="text-link" href="/ai-tools">
              Explore AI tools →
            </a>
          </div>
        </section>

        <section className="shell editorial-intro" aria-labelledby="today">
          <div>
            <p className="eyebrow">The current edit</p>
            <h2 id="today">Useful signals, human judgment.</h2>
          </div>
          <p>
            Momentum metrics arrive in Phase 2. For now, every placement is an
            explicit editorial recommendation—not a popularity score dressed up
            as one.
          </p>
        </section>

        <section className="shell project-section" id="projects">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Projects to evaluate</p>
              <h2>Start with the shortlist.</h2>
            </div>
            <p>12 sourced projects across all six areas of the field guide.</p>
          </div>
          <div className="trending-list">
            {data.latest.map((project, index) => (
              <TrendingRow
                key={project.id}
                project={project}
                rank={index + 1}
              />
            ))}
          </div>
        </section>

        {lead ? (
          <section className="shell feature-section">
            <EditorialFeature project={lead} />
          </section>
        ) : null}

        <section className="shell category-index" aria-labelledby="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Six fields</p>
              <h2 id="categories">Browse by responsibility.</h2>
            </div>
          </div>
          <div className="category-links">
            {data.categories.map((category, index) => (
              <a
                href={`/${category.slug}`}
                key={category.id}
                style={
                  {
                    '--category-accent': category.accent,
                  } as React.CSSProperties
                }
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{category.name}</strong>
                <p>{category.description}</p>
              </a>
            ))}
          </div>
        </section>

        {lead ? (
          <section className="shell variant-proof" aria-labelledby="variants">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Designed for the decision</p>
                <h2 id="variants">Different content, different rhythm.</h2>
              </div>
            </div>
            <div className="variant-grid">
              <StackItemExample project={lead} />
              <a className="search-result" href={`/projects/${lead.slug}`}>
                <span className="eyebrow">Search result · exact name</span>
                <strong>{lead.name}</strong>
                <span>{lead.shortDescription}</span>
                <span className="canonical">/projects/{lead.slug}</span>
              </a>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter lastUpdated={data.lastEditorialUpdate} />
    </>
  )
}
