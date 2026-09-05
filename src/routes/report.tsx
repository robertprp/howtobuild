import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getAccountData } from '../features/contributions/contribution.functions'
import { orpc } from '../lib/orpc-client'
import { safeReturnPath } from '../lib/return-path'

export const Route = createFileRoute('/report')({
  validateSearch: (search: Record<string, unknown>) => ({
    projectId:
      typeof search.projectId === 'string' ? search.projectId : undefined,
    page: safeReturnPath(search.page, '/'),
  }),
  loaderDeps: ({ search }) => ({
    projectId: search.projectId,
    page: search.page,
  }),
  loader: async ({ deps }) => {
    try {
      await getAccountData()
      return deps
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({
        to: '/sign-in',
        search: {
          next: `/report?page=${encodeURIComponent(deps.page)}${deps.projectId ? `&projectId=${encodeURIComponent(deps.projectId)}` : ''}`,
        },
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'Report abuse — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ReportAbuse,
})
function ReportAbuse() {
  const data = Route.useLoaderData()
  const [message, setMessage] = useState('Reports are reviewed by an editor.')
  const mutation = useMutation(orpc.contributions.reportAbuse.mutationOptions())
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate(
      {
        projectId: data.projectId,
        pageUrl: data.page,
        reason: String(form.get('reason')),
        details: String(form.get('details')),
      },
      {
        onSuccess: () => setMessage('Report received. Thank you.'),
        onError: (error) => setMessage(error.message),
      },
    )
  }
  return (
    <main className="shell contribution-page">
      <header>
        <p className="eyebrow">Safety and integrity</p>
        <h1>Report abuse.</h1>
        <p className="lede">
          Report deceptive content, impersonation, malicious links, harassment,
          or another violation.
        </p>
      </header>
      <form className="editor-form" onSubmit={submit}>
        <fieldset>
          <legend>Report</legend>
          <label>
            Reason
            <select name="reason">
              <option>Deceptive or inaccurate</option>
              <option>Malicious link or software</option>
              <option>Impersonation or trademark abuse</option>
              <option>Harassment or harmful content</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Details
            <textarea
              name="details"
              minLength={20}
              maxLength={1500}
              rows={6}
              required
            />
          </label>
        </fieldset>
        <div className="save-row">
          <button className="button" disabled={mutation.isPending}>
            Send report
          </button>
          <p aria-live="polite">{message}</p>
        </div>
      </form>
    </main>
  )
}
