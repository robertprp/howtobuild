import { createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { getPreviewData } from '../../features/editorial/catalog.functions'
import { ProjectContent } from '../projects/$project'

export const Route = createFileRoute('/preview/$project')({
  loader: async ({ params }) => {
    try {
      const data = await getPreviewData({ data: { slug: params.project } })
      if (!data) throw notFound()
      return data
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'UNAUTHORIZED')
        throw error
      throw redirect({
        to: '/sign-in',
        search: { next: `/preview/${params.project}` },
      })
    }
  },
  head: () => ({
    meta: [
      { title: 'Private project preview — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: PreviewPage,
})

function PreviewPage() {
  return <ProjectContent project={Route.useLoaderData().project} preview />
}
