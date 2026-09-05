import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../../components/content-page'

export const Route = createFileRoute('/submit/guidelines')({
  head: () => ({
    meta: [{ title: 'Submission guidelines — HowToBuild.dev' }],
    links: [
      { rel: 'canonical', href: 'https://howtobuild.dev/submit/guidelines' },
    ],
  }),
  component: Guidelines,
})
function Guidelines() {
  return (
    <ContentPage
      eyebrow="Community contributions"
      title="What belongs in the field guide."
      lede="HowToBuild.dev is curated, not exhaustive. A submission starts an editorial review; it never publishes automatically."
    >
      <section>
        <h2>Strong candidates</h2>
        <p>
          Projects should demonstrate meaningful developer interest, technical
          innovation, strong developer experience, notable open-source work,
          ecosystem adoption, or an important new approach to a real problem.
        </p>
      </section>
      <section>
        <h2>Evidence matters</h2>
        <p>
          Submit the canonical GitHub repository and primary links. Describe the
          concrete use case, cost, license, and reason it deserves attention.
          Promotional claims without verifiable sources slow review.
        </p>
      </section>
      <section>
        <h2>Review and conduct</h2>
        <p>
          Duplicate, deceptive, affiliate-driven, abusive, or mass-generated
          submissions may be rejected. Editors may request changes, approve,
          reject, or publish after independent verification. Submission does not
          guarantee inclusion or a particular ranking.
        </p>
      </section>
      <p>
        <a className="button" href="/submit">
          Submit a project
        </a>
      </p>
    </ContentPage>
  )
}
