import { asc, count, eq, inArray } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import {
  abuseReports,
  editSuggestions,
  projects,
  projectLinks,
  projectSources,
  repositories,
  projectRepositories,
  submissions,
} from '../../db/schema'
import { metricHealth } from '../editorial/model'

const DAY = 86_400_000
const REVIEW_DAYS = 30

export async function getOperationsSnapshot() {
  const db = getDb()
  const now = new Date()
  const [
    published,
    sources,
    links,
    repositoryRows,
    submissionRows,
    suggestionRows,
    reports,
  ] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(eq(projects.status, 'published'))
      .orderBy(asc(projects.name)),
    db
      .select({
        projectId: projectSources.projectId,
        checkedAt: projectSources.checkedAt,
      })
      .from(projectSources)
      .innerJoin(projects, eq(projects.id, projectSources.projectId))
      .where(eq(projects.status, 'published')),
    db
      .select({ projectId: projectLinks.projectId, kind: projectLinks.kind })
      .from(projectLinks)
      .innerJoin(projects, eq(projects.id, projectLinks.projectId))
      .where(eq(projects.status, 'published')),
    db
      .select({ repository: repositories })
      .from(repositories)
      .innerJoin(
        projectRepositories,
        eq(projectRepositories.repositoryId, repositories.id),
      )
      .innerJoin(projects, eq(projects.id, projectRepositories.projectId))
      .where(eq(projects.status, 'published')),
    db
      .select({ createdAt: submissions.createdAt })
      .from(submissions)
      .where(inArray(submissions.status, ['submitted', 'under_review'])),
    db
      .select({ createdAt: editSuggestions.createdAt })
      .from(editSuggestions)
      .where(inArray(editSuggestions.status, ['submitted', 'under_review'])),
    db
      .select({ total: count() })
      .from(abuseReports)
      .where(eq(abuseReports.status, 'open')),
  ])

  const reviewQueue = published
    .flatMap((project) => {
      const checked = sources
        .filter((source) => source.projectId === project.id)
        .map((source) => source.checkedAt.getTime())
      const oldestSource = checked.length ? Math.min(...checked) : null
      const reasons: string[] = []
      if (!checked.length) reasons.push('Missing sources')
      if (
        oldestSource !== null &&
        now.getTime() - oldestSource >= REVIEW_DAYS * DAY
      )
        reasons.push('Source checks are at least 30 days old')
      if (checked.some((date) => date > now.getTime()))
        reasons.push('Source check date is in the future')
      if (
        !project.reviewedAt ||
        now.getTime() - project.reviewedAt.getTime() >= REVIEW_DAYS * DAY
      )
        reasons.push('Pricing/license editorial review due')
      if (project.pricingLabel === 'Unknown') reasons.push('Pricing is unknown')
      if (project.openSource && !project.license?.trim())
        reasons.push('Open-source license missing')
      if (
        !project.editorialDescription.trim() ||
        !project.whyInteresting.trim() ||
        !project.pricingSummary.trim() ||
        !project.bestFor.length ||
        !project.notIdealFor.length ||
        !links.some(
          (link) => link.projectId === project.id && link.kind === 'website',
        )
      )
        reasons.push('Required editorial content is incomplete')
      return reasons.length
        ? [
            {
              slug: project.slug,
              name: project.name,
              reasons,
              reviewedAt: project.reviewedAt?.toISOString() ?? null,
              oldestSourceAt:
                oldestSource === null
                  ? null
                  : new Date(oldestSource).toISOString(),
            },
          ]
        : []
    })
    .sort(
      (a, b) =>
        b.reasons.length - a.reasons.length || a.name.localeCompare(b.name),
    )

  // A shared repository counts once, even when several published tools use it.
  const uniqueRepositories = [
    ...new Map(
      repositoryRows.map(({ repository }) => [repository.id, repository]),
    ).values(),
  ]
  const health = { healthy: 0, delayed: 0, stale: 0, disabled: 0 }
  for (const repository of uniqueRepositories)
    health[metricHealth({ ...repository, now })]++
  const active = health.healthy + health.delayed + health.stale
  const waiting = [...submissionRows, ...suggestionRows]
  const oldestWaiting = waiting.length
    ? Math.min(...waiting.map((item) => item.createdAt.getTime()))
    : null
  return {
    generatedAt: now.toISOString(),
    published: published.length,
    reviewDays: REVIEW_DAYS,
    reviewQueue,
    metrics: {
      ...health,
      active,
      healthyPercent: active
        ? Math.round((health.healthy / active) * 1000) / 10
        : null,
      meetsTarget: active ? health.healthy / active >= 0.95 : null,
    },
    moderation: {
      submissions: submissionRows.length,
      suggestions: suggestionRows.length,
      overdue: waiting.filter(
        (item) => now.getTime() - item.createdAt.getTime() >= 3 * DAY,
      ).length,
      oldestAt:
        oldestWaiting === null ? null : new Date(oldestWaiting).toISOString(),
      openReports: reports[0]?.total ?? 0,
    },
  }
}
