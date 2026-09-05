import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Blocks, Search, SlidersHorizontal } from 'lucide-react'
import { SiteFooter } from '../components/site-chrome'
import { StackCard } from '../components/stack-views'
import { ProjectCard } from '../components/project-card'
import { getHomeData } from '../features/editorial/catalog.functions'
import { buildGuides } from '../features/guides/content'
import { seoHead, SITE_DESCRIPTION, SITE_ORIGIN } from '../lib/seo'

export const Route = createFileRoute('/')({
  loader: () => getHomeData(),
  head: () =>
    seoHead({
      title: 'How to build your app: find the right tech stack',
      description: SITE_DESCRIPTION,
      path: '/',
      schemas: [
        {
          '@type': 'WebSite',
          '@id': SITE_ORIGIN + '/#website',
          name: 'HowToBuild.dev',
          alternateName: 'HowToBuild',
          url: SITE_ORIGIN + '/',
          description: SITE_DESCRIPTION,
        },
        {
          '@type': 'Organization',
          '@id': SITE_ORIGIN + '/#organization',
          name: 'HowToBuild.dev',
          url: SITE_ORIGIN + '/',
          logo: SITE_ORIGIN + '/icon-512.png',
        },
      ],
    }),
  component: Home,
})

function Home() {
  const data = Route.useLoaderData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [openSource, setOpenSource] = useState(false)
  const [selfHostable, setSelfHostable] = useState(false)
  const [recommended, setRecommended] = useState(false)
  const [sort, setSort] = useState('editorial')
  const [visibleCount, setVisibleCount] = useState(12)
  const projects = data.projects
    .filter((project) => {
      const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
      const text = [
        project.name,
        project.shortDescription,
        project.projectType,
        ...project.facets.map((facet) => facet.name),
      ]
        .join(' ')
        .toLowerCase()
      return (
        terms.every((term) => text.includes(term)) &&
        (!category || project.category.slug === category) &&
        (!openSource || project.openSource) &&
        (!selfHostable || project.selfHostable) &&
        (!recommended || project.recommended)
      )
    })
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'recent'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : Number(b.recommended) - Number(a.recommended) ||
            a.name.localeCompare(b.name),
    )
  function clearFilters() {
    setQuery('')
    setCategory('')
    setOpenSource(false)
    setSelfHostable(false)
    setRecommended(false)
    setVisibleCount(12)
  }
  return (
    <>
      <main>
        <section className="builder-hero">
          <div className="hero-tool-cloud left" aria-hidden="true">
            {[
              'React',
              'PostgreSQL',
              'Next.js',
              'Tailwind CSS',
              'Docker',
              'Better Auth',
              'TypeScript',
              'Sentry',
              'Astro',
            ].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <div className="hero-tool-cloud right" aria-hidden="true">
            {[
              'Supabase',
              'Clerk',
              'shadcn/ui',
              'Python',
              'AI SDK',
              'Mantine',
              'Vercel',
              'Redis',
              'Go',
            ].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <div className="shell builder-hero-content">
            <p className="eyebrow">An independent guide for developers</p>
            <h1>Tech stacks for builders.</h1>
            <p>
              Find your tech stack. Understand the tradeoffs. Start building
              your app.
            </p>
            <form
              className="builder-search"
              onSubmit={(event) => {
                event.preventDefault()
                document
                  .getElementById('tool-directory')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
              role="search"
            >
              <label>
                <Search size={20} aria-hidden="true" />
                <span>
                  <strong>What are you building?</strong>
                  <input
                    type="search"
                    aria-label="Search developer tools"
                    placeholder="Search tools, frameworks, languages…"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setVisibleCount(12)
                    }}
                  />
                </span>
              </label>
              <label>
                <Blocks size={20} aria-hidden="true" />
                <span>
                  <strong>Category</strong>
                  <select
                    aria-label="Tool category"
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value)
                      setVisibleCount(12)
                    }}
                  >
                    <option value="">All categories</option>
                    {data.categories.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <button type="submit" aria-label="Find matching tools">
                <ArrowRight size={22} />
              </button>
            </form>
            <a
              className="hero-guide-link"
              href="/guides/how-to-choose-a-tech-stack"
            >
              Not sure what stack to use? Start here{' '}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
        <div className="shell builder-directory" id="tool-directory">
          <aside
            className="directory-sidebar"
            aria-label="Filter developer tools"
          >
            <div className="sidebar-heading">
              <span>{data.projects.length} reviewed tools</span>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
            <div className="sidebar-panel">
              <h2>
                <SlidersHorizontal size={18} aria-hidden="true" />
                Your preferences
              </h2>
              <label className="toggle-filter">
                <input
                  type="checkbox"
                  checked={recommended}
                  onChange={(event) => setRecommended(event.target.checked)}
                />
                <span>Editorial picks</span>
              </label>
              <label className="toggle-filter">
                <input
                  type="checkbox"
                  checked={openSource}
                  onChange={(event) => setOpenSource(event.target.checked)}
                />
                <span>Open source</span>
              </label>
              <label className="toggle-filter">
                <input
                  type="checkbox"
                  checked={selfHostable}
                  onChange={(event) => setSelfHostable(event.target.checked)}
                />
                <span>Self-hostable</span>
              </label>
            </div>
            <fieldset className="sidebar-panel">
              <legend>Browse by category</legend>
              <label>
                <input
                  type="radio"
                  name="home-category"
                  checked={!category}
                  onChange={() => setCategory('')}
                />
                All tools<span>{data.projects.length}</span>
              </label>
              {data.categories.map((item) => (
                <label key={item.id}>
                  <input
                    type="radio"
                    name="home-category"
                    checked={category === item.slug}
                    onChange={() => setCategory(item.slug)}
                  />
                  {item.name}
                  <span>
                    {
                      data.projects.filter(
                        (project) => project.category.slug === item.slug,
                      ).length
                    }
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="sidebar-panel sidebar-start">
              <span className="eyebrow">Go from choice to code</span>
              <h2>Need a complete stack?</h2>
              <p>
                Choose your framework, auth, and styling. Copy a prompt to start
                your build.
              </p>
              <a href="/stacks" className="button">
                Explore tech stacks <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <a className="sidebar-methodology" href="/methodology">
              How we review tools →
            </a>
          </aside>
          <section
            className="directory-results"
            aria-labelledby="directory-title"
          >
            <header className="directory-results-heading">
              <div>
                <h2 id="directory-title">Tools for your next build</h2>
                <p role="status">
                  {projects.length}{' '}
                  {projects.length === 1 ? 'match' : 'matches'} · independently
                  curated
                </p>
              </div>
              <label>
                <span className="sr-only">Sort tools</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="editorial">Editorial picks first</option>
                  <option value="recent">Recently updated</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </header>
            <div className="directory-cards">
              {projects.slice(0, visibleCount).map((project) => (
                <ProjectCard project={project} key={project.id} />
              ))}
            </div>
            {!projects.length ? (
              <div className="empty-state">
                <h3>No tools match these filters.</h3>
                <p>Try a broader search or remove a preference.</p>
                <button className="button secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : null}
            {projects.length > visibleCount ? (
              <button
                className="button secondary load-more"
                onClick={() => setVisibleCount((count) => count + 12)}
              >
                Show more tools ({projects.length - visibleCount} remaining)
              </button>
            ) : null}
            <p className="directory-footnote">
              Popularity is not a recommendation.{' '}
              <a href="/trending?period=seven-weeks">
                Explore seven-week GitHub growth
              </a>
              , or browse a <a href="/search">more detailed search</a>.
            </p>
          </section>
        </div>
        <section
          className="shell project-section"
          aria-labelledby="home-stacks"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your starting point</p>
              <h2 id="home-stacks">A stack for what you want to build.</h2>
            </div>
            <a className="text-link" href="/stacks">
              Compare tech stacks →
            </a>
          </div>
          <div className="stack-directory compact">
            {data.stacks.map((stack) => (
              <StackCard stack={stack} key={stack.id} />
            ))}
          </div>
        </section>
        <section
          className="shell project-section"
          aria-labelledby="home-guides"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Practical build guides</p>
              <h2 id="home-guides">From “what stack?” to “how to build.”</h2>
            </div>
            <a href="/guides" className="text-link">
              All build guides →
            </a>
          </div>
          <div className="guide-grid">
            {buildGuides.map((guide) => (
              <article key={guide.slug}>
                <h3>
                  <a href={'/guides/' + guide.slug}>{guide.title}</a>
                </h3>
                <p>{guide.description}</p>
                <a href={'/guides/' + guide.slug} className="text-link">
                  Read the guide →
                </a>
              </article>
            ))}
          </div>
        </section>
        <section className="shell directory-category-links">
          <h2>Explore tools by responsibility</h2>
          <nav aria-label="Tool categories">
            {data.categories.map((item) => (
              <a key={item.id} href={'/' + item.slug}>
                {item.slug === 'ai-tools' ? item.name : `${item.name} tools`} →
              </a>
            ))}
          </nav>
        </section>
      </main>
      <SiteFooter lastUpdated={data.lastEditorialUpdate} />
    </>
  )
}
