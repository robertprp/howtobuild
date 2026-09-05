import { useMutation } from '@tanstack/react-query'
import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getContributionFormData } from '../../features/contributions/contribution.functions'
import { getProjectData } from '../../features/editorial/catalog.functions'
import { orpc } from '../../lib/orpc-client'

export const Route = createFileRoute('/projects/$project_/suggest')({
  loader: async ({ params }) => {
    try {
      const [, result] = await Promise.all([
        getContributionFormData(),
        getProjectData({ data: { slug: params.project } }),
      ])
      if (!result.project) throw notFound()
      return result.project
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({
        to: '/sign-in',
        search: { next: `/projects/${params.project}/suggest` },
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'Suggest an edit — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SuggestEdit,
})

function SuggestEdit() {
  const project = Route.useLoaderData()
  const [startedAt] = useState(() => Date.now())
  const [message, setMessage] = useState(
    'Link to a primary source that supports the proposed change.',
  )
  const mutation = useMutation(orpc.contributions.suggestEdit.mutationOptions())
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate(
      {
        projectId: project.id,
        summary: String(form.get('summary')),
        proposedChanges: String(form.get('proposedChanges')),
        sourceUrl: String(form.get('sourceUrl')),
        startedAt,
        websiteField: String(form.get('websiteField')),
      },
      {
        onSuccess: () => window.location.assign('/account/submissions'),
        onError: (error) => setMessage(error.message),
      },
    )
  }
  return (
    <main className="shell contribution-page">
      <header>
        <a href={`/projects/${project.slug}`}>← {project.name}</a>
        <p className="eyebrow">Community correction</p>
        <h1>Suggest an edit.</h1>
        <p className="lede">
          Suggestions enter moderation and never alter the published page
          directly.
        </p>
      </header>
      <form className="editor-form" onSubmit={submit}>
        <fieldset>
          <legend>Proposed change</legend>
          <label>
            Short summary
            <input
              name="summary"
              minLength={20}
              maxLength={300}
              required
              placeholder="Pricing page now lists a different free-tier limit"
            />
          </label>
          <label>
            What should change, and why?
            <textarea
              name="proposedChanges"
              minLength={30}
              maxLength={2000}
              rows={7}
              required
            />
          </label>
          <label>
            Primary source URL
            <input type="url" name="sourceUrl" required />
          </label>
        </fieldset>
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="websiteField" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="save-row">
          <button className="button" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit suggestion'}
          </button>
          <p aria-live="polite">{message}</p>
        </div>
      </form>
    </main>
  )
}
