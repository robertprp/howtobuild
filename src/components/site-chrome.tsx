import { Link } from '@tanstack/react-router'

const categories = [
  ['Frontend', '/frontend'],
  ['Backend', '/backend'],
  ['Mobile', '/mobile'],
  ['DevOps', '/devops'],
  ['Observability', '/observability'],
  ['AI Tools', '/ai-tools'],
] as const

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link className="wordmark" to="/" aria-label="HowToBuild.dev home">
          HowToBuild<span>.dev</span>
        </Link>
        <nav aria-label="Primary navigation">
          <details className="nav-categories">
            <summary>Browse projects</summary>
            <div className="nav-menu">
              {categories.map(([label, href]) => (
                <a href={href} key={href}>
                  {label}
                </a>
              ))}
            </div>
          </details>
          <a href="/stacks">Stacks</a>
          <a href="/trending">Trending</a>
          <a href="/search">Search</a>
          <a href="/admin">Editor</a>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter({ lastUpdated }: { lastUpdated?: string | null }) {
  const formatted = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeZone: 'UTC',
      }).format(new Date(lastUpdated))
    : null
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <p className="wordmark">HowToBuild.dev</p>
        <p>
          An independent field guide to the tools developers are building with.
        </p>
        {formatted ? (
          <p className="footer-date">Last editorial update {formatted}</p>
        ) : (
          <span aria-hidden="true" />
        )}
        <nav aria-label="Editorial and legal">
          <a href="/methodology">Methodology</a>
          <a href="/about">About</a>
          <a href="/corrections">Corrections</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </div>
    </footer>
  )
}
