import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/content-page'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [{ title: 'Privacy — HowToBuild.dev' }],
    links: [{ rel: 'canonical', href: 'https://howtobuild.dev/privacy' }],
  }),
  component: Privacy,
})

function Privacy() {
  return (
    <ContentPage
      eyebrow="Effective September 4, 2026"
      title="Privacy"
      lede="We collect the minimum operational information needed to run and improve this field guide."
    >
      <section>
        <h2>Public browsing</h2>
        <p>
          The service may process standard request data such as IP address, user
          agent, requested page, and timing in short-lived hosting and security
          logs. Configured analytics records aggregate page usage. Search
          queries that return no results are normalized and counted; they are
          not stored with raw IP addresses.
        </p>
      </section>
      <section>
        <h2>Performance and errors</h2>
        <p>
          We collect page performance measurements, route names, browser
          characteristics, and application error details to find regressions. Do
          not put secrets or personal information into public URLs or search
          queries.
        </p>
      </section>
      <section>
        <h2>Accounts and providers</h2>
        <p>
          Editor accounts store identity, session, and security records required
          for authentication. OAuth and email providers process information
          under their own policies. Community accounts are not part of the
          public beta.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions or deletion requests can be sent to{' '}
          <a href="mailto:privacy@howtobuild.dev">privacy@howtobuild.dev</a>.
        </p>
      </section>
    </ContentPage>
  )
}
