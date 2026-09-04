import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { Providers } from '../components/providers'
import { SiteHeader } from '../components/site-chrome'

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
        content: 'A sourced editorial field guide to modern developer tools.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
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
        </Providers>
        <Scripts />
      </body>
    </html>
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
