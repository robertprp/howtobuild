import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { Providers } from '../components/providers'
import { SiteHeader } from '../components/site-chrome'
import { Telemetry } from '../components/telemetry'
import { SITE_DESCRIPTION, SITE_INDEXABLE } from '../lib/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'HowToBuild.dev',
      },
      {
        name: 'description',
        content: SITE_DESCRIPTION,
      },
      { name: 'theme-color', content: '#1d211d' },
      ...(!SITE_INDEXABLE
        ? [{ name: 'robots', content: 'noindex, follow' }]
        : []),
      ...(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
        ? [
            {
              name: 'google-site-verification',
              content: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION,
            },
          ]
        : []),
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96.png',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: 'any',
        href: '/favicon.svg',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootError,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <SiteHeader />
          <div id="main-content">{children}</div>
          <Telemetry />
        </Providers>
        {import.meta.env.VITE_ANALYTICS_SCRIPT_URL ? (
          <script
            defer
            src={import.meta.env.VITE_ANALYTICS_SCRIPT_URL}
            data-website-id={import.meta.env.VITE_ANALYTICS_SITE_ID}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}

function RootError({ error, reset }: ErrorComponentProps) {
  const detail = error instanceof Error ? error.message : 'Unknown error'

  return (
    <main className="shell">
      <div className="empty-state">
        <p className="eyebrow">Application error</p>
        <h1>The field guide could not be loaded.</h1>
        <p>
          Please try again. If the problem continues, check the database
          connection and migration status.
        </p>
        {process.env.NODE_ENV !== 'production' ? (
          <pre className="error-detail">{detail}</pre>
        ) : null}
        <button className="button" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  )
}

function NotFound() {
  return (
    <main className="shell">
      <p className="eyebrow">404 · Not found</p>
      <h1>The page you requested is outside this field guide.</h1>
      <a className="button" href="/">
        Return to the field guide
      </a>
    </main>
  )
}
