import { seoHead, itemList } from '../../lib/seo'
import { createFileRoute } from '@tanstack/react-router'

import { StackCard } from '../../components/stack-views'
import { SiteFooter } from '../../components/site-chrome'
import { getStacksData } from '../../features/stacks/stack.functions'

export const Route = createFileRoute('/stacks/')({
  loader: () => getStacksData(),
  head: ({ loaderData }) =>
    seoHead({
      title: 'Tech stacks for SaaS, AI apps, and web development',
      description:
        'Compare technology stacks by framework, authentication, database, cost, and ownership. Customize a stack and copy its build prompt.',
      path: '/stacks',
      type: 'CollectionPage',
      schemas: [
        itemList(
          (loaderData ?? []).map((stack) => ({
            name: stack.name,
            path: '/stacks/' + stack.slug,
          })),
        ),
      ],
    }),
  component: StackDirectory,
})

function StackDirectory() {
  const stacks = Route.useLoaderData()
  return (
    <>
      <main className="shell stacks-page">
        <header className="stacks-hero">
          <p className="eyebrow">Opinionated combinations</p>
          <h1>Find the right tech stack for your app.</h1>
          <p className="lede">
            Complete starting points organized by responsibility—with the cost,
            ownership boundary, alternatives, and uncomfortable tradeoffs left
            in view.
          </p>
        </header>
        <section className="stack-directory" aria-label="Published stacks">
          {stacks.map((stack) => (
            <StackCard stack={stack} key={stack.id} />
          ))}
        </section>
        <section className="stack-guidance">
          <h2>What stack should you use?</h2>
          <p>
            Start with the product you are building, your team's experience, and
            the infrastructure you can maintain. Compare each stack's data,
            auth, and deployment responsibilities, then customize its starter
            prompt.
          </p>
          <a className="text-link" href="/guides/how-to-choose-a-tech-stack">
            Read the tech stack decision guide →
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
