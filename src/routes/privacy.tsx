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
      eyebrow="Effective September 5, 2026"
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
          Contributor and editor accounts store identity, session, and security
          records required for authentication, including session IP and browser
          information. OAuth and email providers process information under their
          own policies. You can review active sessions and revoke other sessions
          from your account page.
        </p>
      </section>
      <section>
        <h2>Community contributions</h2>
        <p>
          We retain submitted project details, edit suggestions, review
          responses, moderation decisions, and abuse reports for editorial
          review and accountability. Contributors can see their own contribution
          history; editors can review submissions and reports. Please do not
          include credentials or sensitive personal information. Anti-abuse
          counters use hashed account and IP identifiers, separate from
          authentication records. Choosing a stack or writing a starter prompt
          happens in your browser and does not submit that prompt to a
          coding-assistant provider.
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
