import { useMutation } from '@tanstack/react-query'
import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import {
  getEditorData,
  getHistoryData,
} from '../../../features/editorial/catalog.functions'
import type { ProjectDraft } from '../../../features/editorial/model'
import { orpc } from '../../../lib/orpc-client'

export const Route = createFileRoute('/admin/projects/$project')({
  loader: async ({ params }) => {
    try {
      const desk = await getEditorData()
      if (params.project === 'new')
        return { ...desk, project: null, history: null }
      const project = desk.projects.find((item) => item.slug === params.project)
      if (!project) throw notFound()
      const history = await getHistoryData({ data: { projectId: project.id } })
      return { ...desk, project, history }
    } catch (error) {
      if (error && typeof error === 'object' && 'isNotFound' in error)
        throw error
      throw redirect({ to: '/sign-in' })
    }
  },
  head: () => ({
    meta: [
      { title: 'Edit project — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProjectEditor,
})

function lines(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function ProjectEditor() {
  const { project, categories, history } = Route.useLoaderData()
  const [message, setMessage] = useState(
    'Changes are saved as attributable revisions.',
  )
  const save = useMutation(orpc.editorial.saveDraft.mutationOptions())
  const publication = useMutation(
    orpc.editorial.setPublication.mutationOptions(),
  )

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const links = [
      ['website', form.get('website')],
      ['documentation', form.get('documentation')],
      ['repository', form.get('repository')],
      ['pricing', form.get('pricing')],
    ]
      .filter((entry): entry is [string, FormDataEntryValue] =>
        Boolean(entry[1]),
      )
      .map(([kind, url]) => ({
        kind,
        url: String(url),
      })) as ProjectDraft['links']
    const input: ProjectDraft = {
      id: project?.id,
      slug: String(form.get('slug')),
      name: String(form.get('name')),
      shortDescription: String(form.get('shortDescription')),
      editorialDescription: String(form.get('editorialDescription')),
      whyInteresting: String(form.get('whyInteresting')),
      bestFor: lines(form.get('bestFor')),
      notIdealFor: lines(form.get('notIdealFor')),
      projectType: String(form.get('projectType')),
      categoryId: String(form.get('categoryId')),
      openSource: form.has('openSource'),
      license: String(form.get('license') || '') || null,
      selfHostable: form.has('selfHostable'),
      pricingLabel: String(
        form.get('pricingLabel'),
      ) as ProjectDraft['pricingLabel'],
      pricingSummary: String(form.get('pricingSummary')),
      recommended: form.has('recommended'),
      worthWatching: form.has('worthWatching'),
      links,
      sources: [
        {
          claim: String(form.get('sourceClaim')),
          sourceType: 'maintainer',
          url: String(form.get('sourceUrl')),
        },
      ],
      reason: String(form.get('reason')),
    }
    save.mutate(input, {
      onSuccess: (result) => {
        setMessage(`Revision ${result.revision} saved.`)
        if (!project) window.location.assign(`/admin/projects/${result.slug}`)
      },
      onError: (error) => setMessage(error.message),
    })
  }

  function changePublication(publish: boolean) {
    if (!project) return
    publication.mutate(
      {
        projectId: project.id,
        publish,
        reason: publish
          ? 'Editorial review completed and approved'
          : 'Removed from the public catalog for editorial review',
      },
      {
        onSuccess: () => window.location.reload(),
        onError: (error) => setMessage(error.message),
      },
    )
  }

  const link = (kind: string) =>
    project?.links.find((item) => item.kind === kind)?.url ?? ''
  const source = project?.sources[0]
  return (
    <main className="editor-page shell">
      <header className="editor-heading">
        <div>
          <a className="back-link" href="/admin">
            ← Editorial desk
          </a>
          <p className="eyebrow">
            {project ? `Editing · ${project.status}` : 'New draft'}
          </p>
          <h1>{project?.name ?? 'Add a project'}</h1>
        </div>
        {project ? (
          <div className="editor-actions">
            <a className="button secondary" href={`/preview/${project.slug}`}>
              Preview
            </a>
            <button
              className="button"
              onClick={() => changePublication(project.status !== 'published')}
              disabled={publication.isPending}
            >
              {project.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        ) : null}
      </header>
      <form className="editor-form" onSubmit={submit}>
        <fieldset>
          <legend>Identity</legend>
          <div className="field-grid">
            <label>
              Name
              <input name="name" defaultValue={project?.name} required />
            </label>
            <label>
              Canonical slug
              <input
                name="slug"
                defaultValue={project?.slug}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </label>
            <label>
              Category
              <select
                name="categoryId"
                defaultValue={project?.category.id ?? categories[0]?.id}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Project type
              <input
                name="projectType"
                defaultValue={project?.projectType}
                required
              />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Editorial judgment</legend>
          <label>
            One-line purpose
            <textarea
              name="shortDescription"
              rows={2}
              defaultValue={project?.shortDescription}
              required
            />
          </label>
          <label>
            Overview
            <textarea
              name="editorialDescription"
              rows={5}
              defaultValue={project?.editorialDescription}
              required
            />
          </label>
          <label>
            Why it is interesting
            <textarea
              name="whyInteresting"
              rows={4}
              defaultValue={project?.whyInteresting}
              required
            />
          </label>
          <div className="field-grid">
            <label>
              Best for <small>One item per line</small>
              <textarea
                name="bestFor"
                rows={5}
                defaultValue={project?.bestFor.join('\n')}
                required
              />
            </label>
            <label>
              Not ideal for <small>One item per line</small>
              <textarea
                name="notIdealFor"
                rows={5}
                defaultValue={project?.notIdealFor.join('\n')}
                required
              />
            </label>
          </div>
          <div className="check-row">
            <label>
              <input
                type="checkbox"
                name="recommended"
                defaultChecked={project?.recommended}
              />{' '}
              Recommended
            </label>
            <label>
              <input
                type="checkbox"
                name="worthWatching"
                defaultChecked={project?.worthWatching}
              />{' '}
              Worth watching
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Open source & cost</legend>
          <div className="field-grid">
            <label>
              Pricing classification
              <select
                name="pricingLabel"
                defaultValue={project?.pricingLabel ?? 'Unknown'}
              >
                {[
                  'Unknown',
                  'Open Source',
                  'Free',
                  'Generous Free Tier',
                  'Limited Free Tier',
                  'Paid',
                  'Enterprise',
                ].map((label) => (
                  <option key={label}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              License
              <input
                name="license"
                defaultValue={project?.license ?? ''}
                placeholder="Unknown is acceptable"
              />
            </label>
          </div>
          <label>
            Pricing summary
            <textarea
              name="pricingSummary"
              rows={3}
              defaultValue={project?.pricingSummary}
              required
            />
          </label>
          <div className="check-row">
            <label>
              <input
                type="checkbox"
                name="openSource"
                defaultChecked={project?.openSource}
              />{' '}
              Open source
            </label>
            <label>
              <input
                type="checkbox"
                name="selfHostable"
                defaultChecked={project?.selfHostable}
              />{' '}
              Self-hostable
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Canonical links & source</legend>
          <div className="field-grid">
            <label>
              Website
              <input
                type="url"
                name="website"
                defaultValue={link('website')}
                required
              />
            </label>
            <label>
              Documentation
              <input
                type="url"
                name="documentation"
                defaultValue={link('documentation')}
                required
              />
            </label>
            <label>
              Repository
              <input
                type="url"
                name="repository"
                defaultValue={link('repository')}
              />
            </label>
            <label>
              Pricing page
              <input type="url" name="pricing" defaultValue={link('pricing')} />
            </label>
          </div>
          <label>
            Claim checked
            <input
              name="sourceClaim"
              defaultValue={
                source?.claim ??
                'Canonical project facts, license, and pricing classification'
              }
              required
            />
          </label>
          <label>
            Maintainer source URL
            <input
              type="url"
              name="sourceUrl"
              defaultValue={source?.url ?? ''}
              required
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Revision note</legend>
          <label>
            What changed, and why?
            <textarea name="reason" rows={2} minLength={8} required />
          </label>
          <div className="save-row">
            <button className="button" type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save revision'}
            </button>
            <p aria-live="polite">{message}</p>
          </div>
        </fieldset>
      </form>
      {history ? (
        <section className="history">
          <p className="eyebrow">Revision & audit trail</p>
          {history.revisions.map((revision) => (
            <article key={revision.id}>
              <strong>Revision {revision.revision}</strong>
              <span>{revision.reason}</span>
              <time>
                {new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(revision.createdAt))}
              </time>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
