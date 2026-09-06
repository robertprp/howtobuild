import { createFileRoute, redirect } from '@tanstack/react-router'
import { getLinkReportData } from '../../features/operations/operations.functions'

export const Route = createFileRoute('/admin/links')({
  loader: async () => {
    try {
      return await getLinkReportData()
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED')
        throw redirect({ to: '/sign-in', search: { next: '/admin/links' } })
      throw error
    }
  },
  head: () => ({
    meta: [
      { title: 'Link monitoring — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: LinkReport,
  errorComponent: () => (
    <main className="admin-page shell">
      <h1>Link report unavailable.</h1>
      <p>
        An editor account and the link-check migration are required. If both are
        configured, check service availability.
      </p>
      <a href="/admin/operations">Back to operations</a>
    </main>
  ),
})

function LinkReport() {
  const links = Route.useLoaderData()
  return (
    <main className="admin-page shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Link monitoring.</h1>
        </div>
        <a className="button secondary" href="/admin/operations">
          Operations dashboard
        </a>
      </header>
      <p>
        Published project links and sources only. Oldest observations appear
        first. A successful HEAD request does not verify content. Confirm
        failures manually before editing; redirects are never followed
        automatically.
      </p>
      <p>
        {links.length} unique URLs ·{' '}
        {links.filter((item) => !item.check).length} unchecked ·{' '}
        {links.filter((item) => item.check?.status === 'broken').length}{' '}
        reported not found/gone. Scheduled checks require configuration and the
        link-check migration.
      </p>
      <ul className="operations-review-list">
        {links.map((item) => (
          <li key={item.hash}>
            <h2>
              {item.check?.status ?? 'Unchecked'}
              {item.check?.httpStatus ? ` · HTTP ${item.check.httpStatus}` : ''}
            </h2>
            <p>{item.url}</p>
            <p>{item.check?.detail ?? 'No saved observation yet.'}</p>
            {item.check && (
              <p>
                Checked:{' '}
                <time dateTime={item.check.checkedAt}>
                  {item.check.checkedAt}
                </time>
              </p>
            )}
            <p>
              Edit project:{' '}
              {item.projects.map((project, index) => (
                <span key={project.slug}>
                  {index > 0 ? ', ' : ''}
                  <a href={`/admin/projects/${project.slug}`}>{project.name}</a>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      {!links.length && <p>No published project links to monitor.</p>}
    </main>
  )
}
