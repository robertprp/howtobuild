import { createFileRoute } from '@tanstack/react-router'

import {
  EditorialFeature,
  StackItemExample,
  TrendingRow,
} from '../components/project-views'
import { SiteFooter } from '../components/site-chrome'
import { StackCard } from '../components/stack-views'
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
            <a className="button" href="/trending">
              Explore trending
            </a>
            <a className="button secondary" href="/stacks">
              Explore stacks
            </a>
            <a className="text-link" href="/search">
              Search the field guide →
            </a>
          </div>
        </section>

        <section className="shell editorial-intro" aria-labelledby="today">
          <div>
            <p className="eyebrow">The current edit</p>
            <h2 id="today">Useful signals, human judgment.</h2>
          </div>
          <p>
            GitHub momentum is calculated from stored 7- and 30-day aggregate
            observations. Editorial recommendations remain a separate signal.
          </p>
        </section>

        <section className="shell project-section" id="projects">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trending now</p>
              <h2>What is moving.</h2>
            </div>
            <p>Transparent evidence, complete windows only.</p>
          </div>
          <div className="trending-list">
            {(data.trending.length ? data.trending : data.latest).map(
              (project, index) => (
                <TrendingRow
                  key={project.id}
                  project={project}
                  rank={index + 1}
                />
              ),
            )}
          </div>
        </section>

        {lead ? (
          <section className="shell feature-section">
            <EditorialFeature project={lead} />
          </section>
        ) : null}

        <section
          className="shell project-section"
          aria-labelledby="home-stacks"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recommended stacks</p>
              <h2 id="home-stacks">Coherent ways to start.</h2>
            </div>
            <a className="text-link" href="/stacks">
              See every stack →
            </a>
          </div>
          <div className="stack-directory compact">
            {data.stacks.map((stack) => (
              <StackCard stack={stack} key={stack.id} />
            ))}
          </div>
        </section>

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
