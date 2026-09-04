import { asc, count, eq } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import {
  auditEvents,
  githubSnapshots,
  projectRepositories,
  projects,
  repositories,
} from '../../db/schema'
import type { EditorIdentity } from '../editorial/auth.server'
import { metricHealth } from '../editorial/model'

export async function listMetricHealth() {
  const rows = await getDb()
    .select({
      repository: repositories,
      projectId: projects.id,
      projectName: projects.name,
      projectSlug: projects.slug,
      snapshotCount: count(githubSnapshots.id),
    })
    .from(repositories)
    .leftJoin(
      projectRepositories,
      eq(projectRepositories.repositoryId, repositories.id),
    )
    .leftJoin(projects, eq(projectRepositories.projectId, projects.id))
    .leftJoin(
      githubSnapshots,
      eq(githubSnapshots.repositoryId, repositories.id),
    )
    .groupBy(repositories.id, projects.id, projects.name, projects.slug)
    .orderBy(
      asc(projects.name),
      asc(repositories.owner),
      asc(repositories.name),
    )

  return rows.map(({ repository, ...row }) => ({
    ...row,
    repository: {
      ...repository,
      lastAttemptAt: repository.lastAttemptAt?.toISOString() ?? null,
      lastSyncedAt: repository.lastSyncedAt?.toISOString() ?? null,
    },
    health: metricHealth(repository),
  }))
}

export async function setRepositoryExclusion(
  repositoryId: string,
  excluded: boolean,
  reason: string,
  actor: EditorIdentity,
) {
  return getDb().transaction(async (tx) => {
    const repository = await tx.query.repositories.findFirst({
      where: eq(repositories.id, repositoryId),
    })
    if (!repository) throw new Error('NOT_FOUND')
    const projectLink = await tx.query.projectRepositories.findFirst({
      where: eq(projectRepositories.repositoryId, repositoryId),
    })
    await tx
      .update(repositories)
      .set({
        manuallyExcluded: excluded,
        exclusionReason: excluded ? reason : null,
      })
      .where(eq(repositories.id, repositoryId))
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      projectId: projectLink?.projectId ?? null,
      action: excluded ? 'repository.excluded' : 'repository.included',
      reason,
      before: {
        manuallyExcluded: repository.manuallyExcluded,
        exclusionReason: repository.exclusionReason,
      },
      after: {
        manuallyExcluded: excluded,
        exclusionReason: excluded ? reason : null,
      },
    })
    return { repositoryId, excluded }
  })
}
