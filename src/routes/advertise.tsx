import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/content-page'
import { sponsorContact } from '../features/sponsorships/config'
import { seoHead } from '../lib/seo'

export const Route = createFileRoute('/advertise')({
  head: () =>
    seoHead({
      title: 'Sponsor HowToBuild.dev',
      description:
        'Relevant developer-tool sponsorships, clearly separated from independent editorial recommendations.',
      path: '/advertise',
    }),
  component: Advertise,
})

function Advertise() {
  return (
    <ContentPage
      eyebrow="Partner with the field guide"
      title="Reach builders making technical decisions."
      lede="A focused sponsorship for developer tools—not a way to buy a better ranking."
    >
      <section>
        <h2>One relevant placement.</h2>
        <p>
          We are exploring limited, clearly labeled sponsorships on public
          category pages and build guides. Each campaign requires editorial
          approval, agreed dates, and a relevant destination. Availability and
          pricing are discussed individually.
        </p>
      </section>
      <section>
        <h2>What stays independent</h2>
        <p>
          Payment never changes inclusion, recommendations, search order, or
          GitHub momentum. We do not offer paid approval, guaranteed customers,
          or access to reader identities. Account, sign-in, admin, and
          starter-prompt content remain outside sponsor inventory.
        </p>
      </section>
      <section>
        <h2>Evidence before promises</h2>
        <p>
          We are establishing an audience baseline and do not publish an
          unverified reach claim. Before any sale, we will agree on the
          placement, reporting limitations, price, cancellation terms, and what
          happens if delivery falls short.
        </p>
      </section>
      <section>
        <h2>Discuss a pilot</h2>
        <p>
          Tell us about your product, the developers it serves, your preferred
          category or guide, and timing. Please do not send customer data or
          confidential credentials.
        </p>
        {sponsorContact ? (
          <a
            className="button"
            data-sponsor-inquiry="true"
            href={`mailto:${sponsorContact}?subject=HowToBuild%20sponsorship%20inquiry`}
          >
            Email about sponsorship
          </a>
        ) : (
          <p className="form-message">
            Sponsorship inquiries are not open yet. Contact details will appear
            here when booking opens.
          </p>
        )}
        <p>An inquiry is not a booking. No payment is taken on this website.</p>
      </section>
    </ContentPage>
  )
}
