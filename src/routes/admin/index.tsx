import { createFileRoute, redirect } from '@tanstack/react-router'

import { getEditorData } from '../../features/editorial/catalog.functions'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    try {
      return await getEditorData()
    } catch {
      throw redirect({ to: '/sign-in' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Editorial desk — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminHome,
})

function AdminHome() {
  const { editor, projects } = Route.useLoaderData()
  return (
    <main className="admin-page shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Editorial desk</p>
          <h1>Good morning, {editor.name.split(' ')[0]}.</h1>
        </div>
        <div className="editor-actions">
          <a className="button secondary" href="/admin/metrics">
            Metric health
          </a>
          <a className="button" href="/admin/projects/new">
            New project
          </a>
        </div>
      </header>
      <section className="admin-summary">
        <div>
          <strong>
            {projects.filter((project) => project.status === 'draft').length}
          </strong>
          <span>Drafts</span>
        </div>
        <div>
          <strong>
            {
              projects.filter((project) => project.status === 'published')
                .length
            }
          </strong>
          <span>Published</span>
        </div>
        <div>
          <strong>
            {projects.filter((project) => project.sources.length === 0).length}
          </strong>
          <span>Missing sources</span>
        </div>
      </section>
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Project desk</p>
            <h2>Current edit</h2>
          </div>
        </div>
        <div className="admin-list">
          {projects.map((project) => (
            <a href={`/admin/projects/${project.slug}`} key={project.id}>
              <span className={`status status-${project.status}`}>
                {project.status}
              </span>
              <strong>{project.name}</strong>
              <span>
                {project.category.name} · {project.projectType}
              </span>
              <time>
                {new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                }).format(new Date(project.updatedAt))}
              </time>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
