import { createFileRoute } from '@tanstack/react-router'

import { StackCard } from '../../components/stack-views'
import { SiteFooter } from '../../components/site-chrome'
import { getStacksData } from '../../features/stacks/stack.functions'

export const Route = createFileRoute('/stacks/')({
  loader: () => getStacksData(),
  head: () => ({
    meta: [
      { title: 'Recommended technology stacks — HowToBuild.dev' },
      {
        name: 'description',
        content:
          'Sourced, opinionated technology stacks with responsibilities, costs, alternatives, and explicit tradeoffs.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://howtobuild.dev/stacks' }],
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
          <h1>Start with a coherent stack.</h1>
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
      </main>
      <SiteFooter />
    </>
  )
}
