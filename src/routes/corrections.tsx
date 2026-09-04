import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/content-page'

export const Route = createFileRoute('/corrections')({
  head: () => ({
    meta: [{ title: 'Corrections — HowToBuild.dev' }],
    links: [{ rel: 'canonical', href: 'https://howtobuild.dev/corrections' }],
  }),
  component: Corrections,
})

function Corrections() {
  return (
    <ContentPage
      eyebrow="Accountability"
      title="Corrections"
      lede="Developer products change quickly. Clear evidence makes corrections quick, fair, and auditable."
    >
      <section>
        <h2>Report an issue</h2>
        <p>
          Email{' '}
          <a href="mailto:corrections@howtobuild.dev">
            corrections@howtobuild.dev
          </a>{' '}
          with the page URL, the statement that needs review, and a primary
          source showing the current fact. Maintainers are welcome to identify
          factual errors; editorial conclusions remain ours.
        </p>
      </section>
      <section>
        <h2>What happens next</h2>
        <p>
          We verify the source, update the underlying record when warranted, and
          preserve the attributable editorial history. Material corrections are
          prioritized over requests to change tone or ranking.
        </p>
      </section>
    </ContentPage>
  )
}
