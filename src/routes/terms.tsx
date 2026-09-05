import { seoHead } from '../lib/seo'
import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/content-page'

export const Route = createFileRoute('/terms')({
  head: () =>
    seoHead({
      title: 'Terms of use',
      description:
        'Terms for browsing and using the HowToBuild.dev developer tools and technology stack guide.',
      path: '/terms',
    }),
  component: Terms,
})

function Terms() {
  return (
    <ContentPage
      eyebrow="Effective September 4, 2026"
      title="Terms"
      lede="HowToBuild.dev provides independent editorial information, not a warranty that a technology is right for your system."
    >
      <section>
        <h2>Use of the guide</h2>
        <p>
          You may browse and link to public pages for lawful purposes. Do not
          disrupt the service, evade access controls, scrape at a rate that
          harms availability, or represent the editorial material as your own.
        </p>
      </section>
      <section>
        <h2>No professional or operational warranty</h2>
        <p>
          Technology, licenses, security posture, and pricing can change. Verify
          primary sources and conduct your own technical, legal, security, and
          financial review before adopting a tool. The service is provided as
          available without guarantees of completeness or uninterrupted
          operation.
        </p>
      </section>
      <section>
        <h2>Names and third-party services</h2>
        <p>
          Product names and marks belong to their respective owners. Links to
          third-party services do not transfer responsibility for their content
          or terms to HowToBuild.dev.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{' '}
          <a href="mailto:legal@howtobuild.dev">legal@howtobuild.dev</a>.
        </p>
      </section>
    </ContentPage>
  )
}
