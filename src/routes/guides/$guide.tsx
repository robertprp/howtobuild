import { createFileRoute, notFound } from '@tanstack/react-router'
import { ContentPage } from '../../components/content-page'
import { Breadcrumbs } from '../../components/breadcrumbs'
import { buildGuides } from '../../features/guides/content'
import { absoluteUrl, seoHead } from '../../lib/seo'

export const Route = createFileRoute('/guides/$guide')({
  loader: ({ params }) => {
    const guide = buildGuides.find((item) => item.slug === params.guide)
    if (!guide) throw notFound()
    return guide
  },
  head: ({ loaderData: guide }) =>
    guide
      ? seoHead({
          title: guide.title,
          description: guide.description,
          path: `/guides/${guide.slug}`,
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Build guides', path: '/guides' },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ],
          schemas: [
            {
              '@type': 'TechArticle',
              headline: guide.title,
              description: guide.description,
              dateModified: guide.updatedAt,
              mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`),
              image: absoluteUrl('/assets/social-card.png'),
              author: {
                '@type': 'Organization',
                name: 'HowToBuild.dev',
                url: absoluteUrl('/about'),
              },
              publisher: {
                '@type': 'Organization',
                name: 'HowToBuild.dev',
                url: absoluteUrl('/'),
              },
            },
          ],
        })
      : { meta: [{ name: 'robots', content: 'noindex, follow' }] },
  component: GuidePage,
})

function GuidePage() {
  const guide = Route.useLoaderData()
  return (
    <ContentPage
      eyebrow="Build guide"
      title={guide.title}
      lede={guide.description}
    >
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Build guides', path: '/guides' },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />
      <p className="guide-byline">
        HowToBuild.dev · Updated{' '}
        <time dateTime={guide.updatedAt}>{guide.updatedAt}</time> ·{' '}
        <a href="/methodology">How we choose tools</a>
      </p>
      <aside className="guide-answer" aria-label="Short answer">
        <strong>The short answer</strong>
        <p>{guide.answer}</p>
      </aside>
      <nav className="guide-toc" aria-label="On this page">
        <strong>In this guide</strong>
        <ol>
          {guide.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {guide.sections.map((section) => (
        <section id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.checklist ? (
            <ul>
              {section.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      <section>
        <h2>Choose a stack and copy the starter prompt</h2>
        <ul>
          {guide.stacks.map((stack) => (
            <li key={stack.path}>
              <a href={stack.path}>{stack.name}</a>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Official sources</h2>
        <p>
          These are decision guides, not benchmark studies. The recommendations
          synthesize the linked documentation; verify current setup instructions
          and pricing before implementation.
        </p>
        <ul>
          {guide.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} rel="noreferrer">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Continue planning your build</h2>
        <ul>
          {buildGuides
            .filter((item) => item.slug !== guide.slug)
            .map((item) => (
              <li key={item.slug}>
                <a href={`/guides/${item.slug}`}>{item.title}</a>
              </li>
            ))}
        </ul>
        <p>
          Found an outdated detail?{' '}
          <a href="/corrections">Send a correction.</a>
        </p>
      </section>
    </ContentPage>
  )
}
