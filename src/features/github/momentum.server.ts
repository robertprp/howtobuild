import { and, asc, eq } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import {
  categories,
  githubSnapshots,
  projectMomentum,
  projectRepositories,
  projects,
  repositories,
} from '../../db/schema'
import {
  calculateMomentumEvidence,
  scoreMomentumWithinCategory,
} from './momentum'

export async function calculateAndStoreMomentum() {
  const db = getDb()
  const linked = await db
    .select({
      projectId: projects.id,
      categoryId: categories.id,
      repositoryId: repositories.id,
    })
    .from(projects)
    .innerJoin(categories, eq(projects.categoryId, categories.id))
    .innerJoin(
      projectRepositories,
      eq(projectRepositories.projectId, projects.id),
    )
    .innerJoin(
      repositories,
      eq(projectRepositories.repositoryId, repositories.id),
    )
    .where(
      and(
        eq(projects.status, 'published'),
        eq(projectRepositories.isDefault, true),
      ),
    )

  const evidence = (
    await Promise.all(
      linked.map(async (item) => {
        const snapshots = await db
          .select({
            id: githubSnapshots.id,
            observedAt: githubSnapshots.observedAt,
            stars: githubSnapshots.stars,
            pushedAt: githubSnapshots.pushedAt,
            latestReleaseAt: githubSnapshots.latestReleaseAt,
          })
          .from(githubSnapshots)
          .where(eq(githubSnapshots.repositoryId, item.repositoryId))
          .orderBy(asc(githubSnapshots.observedAt))
        const result = calculateMomentumEvidence(snapshots)
        return result ? { ...item, evidence: result } : null
      }),
    )
  ).filter((item): item is NonNullable<typeof item> => item !== null)

  const scores = new Map<string, number | null>()
  for (const categoryId of new Set(evidence.map((item) => item.categoryId))) {
    const categoryEvidence = evidence
      .filter((item) => item.categoryId === categoryId)
      .map((item) => item.evidence)
    for (const [snapshotId, score] of scoreMomentumWithinCategory(
      categoryEvidence,
    ))
      scores.set(snapshotId, score)
  }

  for (const item of evidence) {
    const value = item.evidence
    await db
      .insert(projectMomentum)
      .values({
        projectId: item.projectId,
        calculatedAt: value.windowEnd,
        currentSnapshotId: value.currentSnapshotId,
        weeklySnapshotId: value.weeklySnapshotId,
        monthlySnapshotId: value.monthlySnapshotId,
        stars: value.stars,
        absolute7d: value.absolute7d,
        absolute30d: value.absolute30d,
        relative7d: value.relative7d,
        relative30d: value.relative30d,
        activityFactor: value.activityFactor,
        score: scores.get(value.currentSnapshotId) ?? null,
        confidence: value.confidence,
        windowStart: value.windowStart,
        windowEnd: value.windowEnd,
        anomaly: value.anomaly,
        anomalyReasons: value.anomalyReasons,
        algorithmVersion: value.algorithmVersion,
      })
      .onConflictDoUpdate({
        target: [projectMomentum.projectId, projectMomentum.calculatedAt],
        set: {
          score: scores.get(value.currentSnapshotId) ?? null,
          confidence: value.confidence,
          anomaly: value.anomaly,
          anomalyReasons: value.anomalyReasons,
          algorithmVersion: value.algorithmVersion,
        },
      })
  }

  return { calculated: evidence.length }
}
