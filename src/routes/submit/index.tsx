import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { getContributionFormData } from '../../features/contributions/contribution.functions'
import type { SubmissionInput } from '../../features/contributions/model'
import { orpc } from '../../lib/orpc-client'

export const Route = createFileRoute('/submit/')({
  loader: async () => {
    try {
      return await getContributionFormData()
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({ to: '/sign-in', search: { next: '/submit' } })
    }
  },
  head: () => ({
    meta: [
      { title: 'Submit a project — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SubmitProject,
})

function SubmitProject() {
  const { categories, facets } = Route.useLoaderData()
  const [startedAt] = useState(() => Date.now())
  const [message, setMessage] = useState(
    'Start with the canonical GitHub repository. We will fill in what GitHub can verify.',
  )
  const inspect = useMutation(
    orpc.contributions.inspectRepository.mutationOptions(),
  )
  const submit = useMutation(orpc.contributions.submitProject.mutationOptions())

  function inspectRepository(form: HTMLFormElement) {
    const repositoryUrl = String(new FormData(form).get('repositoryUrl') ?? '')
    inspect.mutate(
      { repositoryUrl },
      {
        onSuccess: (data) => {
          const set = (name: string, value: string) => {
            const field = form.elements.namedItem(name) as
              HTMLInputElement | HTMLTextAreaElement | null
            if (field && !field.value) field.value = value
          }
          set('repositoryUrl', data.repositoryUrl)
          set('name', data.name)
          set('shortExplanation', data.description)
          set('website', data.website)
          set(
            'openSourceInformation',
            data.license ? `Repository license: ${data.license}` : '',
          )
          const matchingFacet = facets.find(
            (facet) => facet.name.toLowerCase() === data.language.toLowerCase(),
          )
          if (matchingFacet) {
            const field = form.querySelector<HTMLInputElement>(
              `input[name="ecosystems"][value="${matchingFacet.slug}"]`,
            )
            if (field) field.checked = true
          }
          setMessage(
            'Repository metadata loaded. Review every field before submitting.',
          )
        },
        onError: (error) => setMessage(error.message),
      },
    )
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input: SubmissionInput = {
      repositoryUrl: String(form.get('repositoryUrl')),
      name: String(form.get('name')),
      website: String(form.get('website')),
      documentation: String(form.get('documentation')),
      shortExplanation: String(form.get('shortExplanation')),
      categoryId: String(form.get('categoryId')),
      projectType: String(form.get('projectType')),
      ecosystems: form.getAll('ecosystems').map(String),
      whyInteresting: String(form.get('whyInteresting')),
      pricingInformation: String(form.get('pricingInformation')),
      openSourceInformation: String(form.get('openSourceInformation')),
      startedAt,
      websiteField: String(form.get('websiteField')),
    }
    submit.mutate(input, {
      onSuccess: () => window.location.assign('/account/submissions'),
      onError: (error) => setMessage(error.message),
    })
  }

  return (
    <main className="shell contribution-page">
      <header>
        <p className="eyebrow">Community contribution</p>
        <h1>Submit a project.</h1>
        <p className="lede">
          Give editors enough primary evidence to decide whether the project
          belongs in this deliberately small field guide.
        </p>
        <a href="/submit/guidelines">Read the submission guidelines →</a>
      </header>
      <form className="editor-form" onSubmit={onSubmit}>
        <fieldset>
          <legend>Repository</legend>
          <label>
            Canonical GitHub repository URL
            <input
              type="url"
              name="repositoryUrl"
              required
              placeholder="https://github.com/owner/repository"
            />
          </label>
          <button
            className="button secondary"
            type="button"
            disabled={inspect.isPending}
            onClick={(event) => inspectRepository(event.currentTarget.form!)}
          >
            <Search size={18} aria-hidden="true" />
            {inspect.isPending ? 'Checking…' : 'Load GitHub metadata'}
          </button>
        </fieldset>
        <fieldset>
          <legend>Project identity</legend>
          <div className="field-grid">
            <label>
              Name
              <input name="name" required minLength={2} />
            </label>
            <label>
              Project type
              <input
                name="projectType"
                required
                placeholder="Framework, SDK, platform…"
              />
            </label>
            <label>
              Category
              <select name="categoryId" required>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Website
              <input type="url" name="website" />
            </label>
            <label>
              Documentation
              <input type="url" name="documentation" />
            </label>
          </div>
          <label>
            Short explanation
            <textarea
              name="shortExplanation"
              minLength={30}
              maxLength={500}
              rows={3}
              required
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Why it belongs</legend>
          <label>
            Why is this project interesting?
            <textarea
              name="whyInteresting"
              minLength={30}
              maxLength={1000}
              rows={5}
              required
            />
          </label>
          <div className="field-grid">
            <label>
              Pricing information
              <textarea
                name="pricingInformation"
                minLength={10}
                rows={4}
                required
              />
            </label>
            <label>
              Open-source and license information
              <textarea
                name="openSourceInformation"
                minLength={10}
                rows={4}
                required
              />
            </label>
          </div>
          <div className="facet-checks">
            <p>Languages and ecosystems</p>
            {facets.map((facet) => (
              <label key={facet.id}>
                <input type="checkbox" name="ecosystems" value={facet.slug} />{' '}
                {facet.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave this field empty
            <input name="websiteField" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="save-row">
          <button className="button" disabled={submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit for review'}
          </button>
          <p aria-live="polite">{message}</p>
        </div>
      </form>
    </main>
  )
}
