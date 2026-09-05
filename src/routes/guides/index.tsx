import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../../components/content-page'
import { Breadcrumbs } from '../../components/breadcrumbs'
import { buildGuides } from '../../features/guides/content'
import { itemList, seoHead } from '../../lib/seo'

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Build guides', path: '/guides' },
]
export const Route = createFileRoute('/guides/')({
  head: () =>
    seoHead({
      title: 'How to build an app: tech stack guides',
      description:
        'Practical guides to choosing a tech stack, planning a SaaS app, and comparing React authentication and styling options. Turn decisions into a starter prompt.',
      path: '/guides',
      type: 'CollectionPage',
      breadcrumbs,
      schemas: [
        itemList(
          buildGuides.map((guide) => ({
            name: guide.title,
            path: `/guides/${guide.slug}`,
          })),
        ),
      ],
    }),
  component: () => (
    <ContentPage
      eyebrow="From idea to implementation"
      title="How to build your app."
      lede="Start with the decision in front of you: what to build with, how to structure the first release, or which auth and styling options fit your team."
    >
      <Breadcrumbs items={breadcrumbs} />
      <div className="guide-grid">
        {buildGuides.map((guide) => (
          <article key={guide.slug}>
            <h2>
              <a href={`/guides/${guide.slug}`}>{guide.title}</a>
            </h2>
            <p>{guide.description}</p>
            <a className="text-link" href={`/guides/${guide.slug}`}>
              Read the guide →
            </a>
          </article>
        ))}
      </div>
      <section>
        <h2>Ready to choose your tools?</h2>
        <p>
          Our <a href="/stacks">technology stack guides</a> map each
          responsibility to a tool, explain costs and tradeoffs, and include a
          starter prompt you can copy. Use{' '}
          <a href="/methodology">our methodology</a> to understand the
          difference between editorial recommendations and GitHub momentum.
        </p>
      </section>
    </ContentPage>
  ),
})
