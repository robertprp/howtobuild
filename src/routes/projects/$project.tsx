import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { ProjectMark } from '../../components/project-views'
import { SiteFooter } from '../../components/site-chrome'
import { getProjectData } from '../../features/editorial/catalog.functions'
import type { PublicProject } from '../../features/editorial/model'

export const Route = createFileRoute('/projects/$project')({
  loader: async ({ params }) => {
    const result = await getProjectData({ data: { slug: params.project } })
    if (result.redirectTo)
      throw redirect({
        href: `/projects/${result.redirectTo}`,
        statusCode: 301,
      })
    if (!result.project) throw notFound()
    return result.project
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const title = `${loaderData.name}: uses, pricing, and tradeoffs — HowToBuild.dev`
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.shortDescription },
        { property: 'og:title', content: title },
        { property: 'og:description', content: loaderData.shortDescription },
        { property: 'og:type', content: 'article' },
      ],
      links: [
        {
          rel: 'canonical',
          href: `https://howtobuild.dev/projects/${loaderData.slug}`,
        },
      ],
    }
  },
  component: ProjectPage,
})

export function ProjectContent({
  project,
  preview = false,
}: {
  project: PublicProject
  preview?: boolean
}) {
  return (
    <>
      <main>
        {preview ? (
          <div className="preview-banner">Private draft preview</div>
        ) : null}
        <article className="project-page shell">
          <header className="project-hero">
            <ProjectMark project={project} />
            <div>
              <p className="eyebrow">
                <a href={`/${project.category.slug}`}>
                  {project.category.name}
                </a>{' '}
                · {project.projectType}
              </p>
              <h1>{project.name}</h1>
              <p className="lede">{project.shortDescription}</p>
            </div>
            <dl className="project-facts">
              <div>
                <dt>License</dt>
                <dd>{project.license ?? 'Unknown'}</dd>
              </div>
              <div>
                <dt>Cost</dt>
                <dd>{project.pricingLabel}</dd>
              </div>
              <div>
                <dt>Self-host</dt>
                <dd>{project.selfHostable ? 'Yes' : 'No / not applicable'}</dd>
              </div>
            </dl>
          </header>
          <section className="project-prose project-overview">
            <p className="eyebrow">Overview</p>
            <p>{project.editorialDescription}</p>
          </section>
          <section className="judgment-grid">
            <div>
              <p className="eyebrow">Why it is interesting</p>
              <h2>Why pay attention</h2>
              <p>{project.whyInteresting}</p>
            </div>
            <div>
              <p className="eyebrow">Editorial status</p>
              <p>
                {project.recommended
                  ? 'Recommended for active evaluation.'
                  : project.worthWatching
                    ? 'Worth watching as the project develops.'
                    : 'Included for comparison and context.'}
              </p>
            </div>
          </section>
          <section className="use-grid">
            <div>
              <p className="eyebrow">Best for</p>
              <ul>
                {project.bestFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Not ideal for</p>
              <ul>
                {project.notIdealFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="project-prose">
            <p className="eyebrow">Open source & pricing</p>
            <h2>{project.pricingLabel}</h2>
            <p>{project.pricingSummary}</p>
          </section>
          <section className="momentum-panel" aria-labelledby="github-momentum">
            <div>
              <p className="eyebrow">GitHub momentum</p>
              <h2 id="github-momentum">
                {project.momentum
                  ? `★ ${project.momentum.stars.toLocaleString('en-US')}`
                  : 'History is being collected'}
              </h2>
            </div>
            {project.momentum ? (
              <dl className="momentum-facts">
                <div>
                  <dt>Last 7 days</dt>
                  <dd>
                    {project.momentum.absolute7d === null
                      ? 'Early signal'
                      : `+${project.momentum.absolute7d.toLocaleString('en-US')}`}
                  </dd>
                </div>
                <div>
                  <dt>Last 30 days</dt>
                  <dd>
                    {project.momentum.absolute30d === null
                      ? 'Window incomplete'
                      : `+${project.momentum.absolute30d.toLocaleString('en-US')}`}
                  </dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>
                    {project.momentum.windowStart
                      ? `${new Date(project.momentum.windowStart).toLocaleDateString('en-US', { timeZone: 'UTC' })}–${new Date(project.momentum.windowEnd).toLocaleDateString('en-US', { timeZone: 'UTC' })}`
                      : 'First observation'}{' '}
                    · {project.momentum.confidence} window
                  </dd>
                </div>
              </dl>
            ) : (
              <p>
                GitHub history is never backfilled or extrapolated. Metrics will
                appear after aggregate snapshots have been observed.
              </p>
            )}
          </section>
          <section className="sources">
            <div>
              <p className="eyebrow">Official links</p>
              {project.links.map((link) => (
                <a href={link.url} key={link.kind} rel="noreferrer">
                  {link.kind} ↗
                </a>
              ))}
            </div>
            <div>
              <p className="eyebrow">Sources checked</p>
              {project.sources.map((source) => (
                <p key={`${source.claim}-${source.url}`}>
                  <a href={source.url} rel="noreferrer">
                    {source.claim}
                  </a>
                  <small>
                    {source.sourceType} ·{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    }).format(new Date(source.checkedAt))}
                  </small>
                </p>
              ))}
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}

function ProjectPage() {
  return <ProjectContent project={Route.useLoaderData()} />
}
