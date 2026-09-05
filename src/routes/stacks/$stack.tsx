import { createFileRoute, notFound } from '@tanstack/react-router'

import { ProjectMark } from '../../components/project-views'
import { SiteFooter } from '../../components/site-chrome'
import { getStackData } from '../../features/stacks/stack.functions'
import { StackStarter } from '../../components/stack-starter'

export const Route = createFileRoute('/stacks/$stack')({
  loader: async ({ params }) => {
    const stack = await getStackData({ data: { slug: params.stack } })
    if (!stack) throw notFound()
    return stack
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const title = `${loaderData.name} technology stack — HowToBuild.dev`
    return {
      meta: [
        { title },
        { name: 'description', content: loaderData.summary },
        { property: 'og:title', content: title },
        { property: 'og:description', content: loaderData.summary },
      ],
      links: [
        {
          rel: 'canonical',
          href: `https://howtobuild.dev/stacks/${loaderData.slug}`,
        },
      ],
    }
  },
  component: StackPage,
})

function StackPage() {
  const stack = Route.useLoaderData()
  const openCount = stack.items.filter((item) => item.project.openSource).length
  const selfHostedCount = stack.items.filter(
    (item) => item.project.selfHostable,
  ).length
  return (
    <>
      <main>
        <article className="shell stack-page">
          <header className="stack-hero">
            <p className="eyebrow">Recommended stack · {stack.earlyStageFit}</p>
            <h1>{stack.name}</h1>
            <p className="lede">{stack.summary}</p>
            <dl className="stack-profile">
              <div>
                <dt>Responsibilities</dt>
                <dd>{stack.items.length}</dd>
              </div>
              <div>
                <dt>Open source</dt>
                <dd>{openCount} choices</dd>
              </div>
              <div>
                <dt>Self-hostable</dt>
                <dd>{selfHostedCount} choices</dd>
              </div>
            </dl>
          </header>

          <section className="stack-intent">
            <div>
              <p className="eyebrow">What it is for</p>
              <p>{stack.description}</p>
            </div>
            <div>
              <p className="eyebrow">Who should use it</p>
              <p>{stack.targetUser}</p>
            </div>
          </section>
          <StackStarter key={stack.id} stack={stack} />

          <section className="stack-map" aria-labelledby="responsibility-map">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Responsibility map</p>
                <h2 id="responsibility-map">One choice for each job.</h2>
              </div>
            </div>
            <ol>
              {stack.items.map((item) => (
                <li key={item.id}>
                  <span className="stack-order">
                    {String(item.sortOrder).padStart(2, '0')}
                  </span>
                  <ProjectMark project={item.project} />
                  <div className="stack-choice">
                    <p className="eyebrow">{item.responsibility}</p>
                    <h3>
                      <a href={`/projects/${item.project.slug}`}>
                        {item.project.name}
                      </a>
                    </h3>
                    <p>{item.rationale}</p>
                    <div className="choice-badges">
                      <span>
                        {item.project.openSource
                          ? 'Open source'
                          : 'Proprietary'}
                      </span>
                      <span>{item.project.pricingLabel}</span>
                      {item.project.selfHostable ? (
                        <span>Self-hostable</span>
                      ) : null}
                    </div>
                    {item.alternatives.length ? (
                      <div className="stack-alternatives">
                        <strong>Alternatives</strong>
                        {item.alternatives.map((alternative) => (
                          <p key={alternative.project.id}>
                            <a href={`/projects/${alternative.project.slug}`}>
                              {alternative.project.name}
                            </a>{' '}
                            — {alternative.rationale}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="stack-assessment">
            <div>
              <p className="eyebrow">Open-source profile</p>
              <h2>What you can own.</h2>
              <p>{stack.openSourceSummary}</p>
            </div>
            <div>
              <p className="eyebrow">Cost profile</p>
              <h2>Where cost appears.</h2>
              <p>{stack.costSummary}</p>
            </div>
          </section>

          <section className="stack-tradeoffs">
            <p className="eyebrow">Tradeoffs</p>
            <h2>What this stack asks you to accept.</h2>
            <ul>
              {stack.tradeoffs.map((tradeoff) => (
                <li key={tradeoff}>{tradeoff}</li>
              ))}
            </ul>
          </section>

          <section className="sources">
            <div>
              <p className="eyebrow">Editorial note</p>
              <p>
                Stack choices are editorial recommendations, not an automatic
                popularity ranking. Pricing and capabilities can change.
              </p>
            </div>
            <div>
              <p className="eyebrow">Sources checked</p>
              {stack.sources.map((source) => (
                <p key={`${source.claim}-${source.url}`}>
                  <a href={source.url} rel="noreferrer">
                    {source.claim}
                  </a>
                  <small>
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
