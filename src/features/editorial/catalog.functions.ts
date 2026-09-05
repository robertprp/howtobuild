import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { listMetricHealth } from '../github/metrics.server'
import { listPublishedStacks } from '../stacks/store.server'

import { requireEditor } from './auth.server'
import {
  findProjectBySlug,
  findRedirect,
  getProjectHistory,
  listCategories,
  listEditorProjects,
  listPublishedProjects,
} from './store.server'

const publicHeaders = new Headers({
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
})

const privateHeaders = new Headers({
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie, Authorization',
})

export const getHomeData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(publicHeaders)
    const [allCategories, allProjects, allStacks] = await Promise.all([
      listCategories(),
      listPublishedProjects(),
      listPublishedStacks(),
    ])
    return {
      categories: allCategories,
      projects: allProjects,
      trending: allProjects
        .filter(
          (project) =>
            project.momentum?.score !== null &&
            project.momentum?.health !== 'stale' &&
            project.momentum?.health !== 'disabled' &&
            !project.momentum?.anomaly,
        )
        .sort((a, b) => (b.momentum?.score ?? 0) - (a.momentum?.score ?? 0))
        .slice(0, 8),
      featured: allProjects
        .filter((project) => project.recommended)
        .slice(0, 6),
      watching: allProjects
        .filter((project) => project.worthWatching)
        .slice(0, 3),
      latest: allProjects.slice(0, 8),
      stacks: allStacks.slice(0, 4),
      lastEditorialUpdate:
        allProjects
          .map((project) => project.publishedAt)
          .filter((date): date is string => Boolean(date))
          .sort()
          .at(-1) ?? null,
    }
  },
)

export const getCategoryData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    setResponseHeaders(publicHeaders)
    const allCategories = await listCategories()
    const category = allCategories.find((item) => item.slug === data.slug)
    if (!category) return null
    return {
      category,
      categories: allCategories,
      projects: await listPublishedProjects(data.slug),
    }
  })

export const getProjectData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    setResponseHeaders(publicHeaders)
    const project = await findProjectBySlug(data.slug)
    if (project) return { project, redirectTo: null }
    return { project: null, redirectTo: await findRedirect(data.slug) }
  })

export const getEditorData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(privateHeaders)
    const editor = await requireEditor(getRequest())
    const [allCategories, allProjects] = await Promise.all([
      listCategories(),
      listEditorProjects(),
    ])
    return { editor, categories: allCategories, projects: allProjects }
  },
)

export const getPreviewData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    setResponseHeaders(privateHeaders)
    const editor = await requireEditor(getRequest())
    const project = await findProjectBySlug(data.slug, true)
    if (!project) return null
    return { editor, project }
  })

export const getHistoryData = createServerFn({ method: 'GET' })
  .validator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data }) => {
    setResponseHeaders(privateHeaders)
    await requireEditor(getRequest())
    return getProjectHistory(data.projectId)
  })

export const getMetricsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(privateHeaders)
    const editor = await requireEditor(getRequest())
    return { editor, repositories: await listMetricHealth() }
  },
)
