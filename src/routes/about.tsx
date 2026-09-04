import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/content-page'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About — HowToBuild.dev' },
      {
        name: 'description',
        content:
          'Why HowToBuild.dev exists and how its editorial field guide is maintained.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://howtobuild.dev/about' }],
  }),
  component: About,
})

function About() {
  return (
    <ContentPage
      eyebrow="Independent field guide"
      title="Software changes faster than static lists."
      lede="HowToBuild.dev tracks the projects, frameworks, tools, and stacks worth understanding now."
    >
      <section>
        <h2>A decision aid, not a directory</h2>
        <p>
          The catalog combines public ecosystem signals, GitHub momentum,
          sourced product facts, and explicit editorial judgment. We prefer a
          smaller maintained collection over thousands of entries with no point
          of view.
        </p>
      </section>
      <section>
        <h2>What readers should expect</h2>
        <p>
          Every project page aims to say what a tool is good for, where it is a
          poor fit, what it costs, whether it can be self-hosted, and why it
          deserves attention. Every stack explains both the recommendation and
          the compromise.
        </p>
      </section>
      <section>
        <h2>Independence</h2>
        <p>
          Inclusion and ranking are not available for purchase. If sponsorships
          or commercial relationships are introduced, they will be labeled and
          kept separate from editorial recommendations.
        </p>
      </section>
    </ContentPage>
  )
}
