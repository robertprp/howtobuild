import { and, desc, eq, ne, sql } from 'drizzle-orm'
import type { PoolClient } from 'pg'

import { getDb, getPool } from '../../db/client.server'
import {
  githubSnapshots,
  repositories,
  projectLinks,
  projectRepositories,
  projects,
} from '../../db/schema'
import type { SnapshotStore } from './collector'

export const postgresSnapshotStore: SnapshotStore = {
  async findRepository(owner, name) {
    const repository = (
      await getDb()
        .select({ id: repositories.id, etag: repositories.etag })
        .from(repositories)
        .where(and(eq(repositories.owner, owner), eq(repositories.name, name)))
        .limit(1)
    ).at(0)

    return repository ?? null
  },

  async markNotModified(repositoryId, observedAt) {
    const db = getDb()
    await db.transaction(async (tx) => {
      const latest = (
        await tx
          .select()
          .from(githubSnapshots)
          .where(eq(githubSnapshots.repositoryId, repositoryId))
          .orderBy(desc(githubSnapshots.observedAt))
          .limit(1)
      ).at(0)
      if (latest) {
        await tx
          .insert(githubSnapshots)
          .values({
            repositoryId,
            observedAt,
            stars: latest.stars,
            forks: latest.forks,
            openIssues: latest.openIssues,
            pushedAt: latest.pushedAt,
            latestReleaseAt: latest.latestReleaseAt,
            responseEtag: latest.responseEtag,
            requestOutcome: '304',
            collectorVersion: 'v1',
            raw: latest.raw,
          })
          .onConflictDoNothing()
      }
      await tx
        .update(repositories)
        .set({
          lastAttemptAt: observedAt,
          lastSyncedAt: observedAt,
          syncStatus: 'healthy',
          lastError: null,
          consecutiveFailures: 0,
        })
        .where(eq(repositories.id, repositoryId))
    })
  },

  async appendSnapshot({ observation, etag, observedAt }) {
    await getDb().transaction(async (tx) => {
      const existing = (
        await tx
          .select({ id: repositories.id })
          .from(repositories)
          .where(
            and(
              eq(repositories.owner, observation.owner),
              eq(repositories.name, observation.name),
            ),
          )
          .limit(1)
      ).at(0)
      const repositoryValues = {
        githubNodeId: observation.nodeId,
        owner: observation.owner,
        name: observation.name,
        etag,
        htmlUrl: observation.htmlUrl,
        defaultBranch: observation.defaultBranch,
        archived: observation.archived,
        private: observation.private,
        syncStatus:
          observation.archived || observation.private ? 'disabled' : 'healthy',
        lastAttemptAt: observedAt,
        lastSyncedAt: observedAt,
        lastError: null,
        consecutiveFailures: 0,
      }
      const [repository] = existing
        ? await tx
            .update(repositories)
            .set(repositoryValues)
            .where(eq(repositories.id, existing.id))
            .returning({ id: repositories.id })
        : await tx
            .insert(repositories)
            .values(repositoryValues)
            .onConflictDoUpdate({
              target: repositories.githubNodeId,
              set: repositoryValues,
            })
            .returning({ id: repositories.id })

      await tx.insert(githubSnapshots).values({
        repositoryId: repository.id,
        observedAt,
        stars: observation.stars,
        forks: observation.forks,
        openIssues: observation.openIssues,
        pushedAt: observation.pushedAt,
        latestReleaseAt: observation.latestReleaseAt,
        responseEtag: etag,
        requestOutcome: '200',
        collectorVersion: 'v1',
        raw: observation.raw,
      })
    })
  },
}

export async function listCollectableRepositories() {
  return getDb()
    .select({
      id: repositories.id,
      owner: repositories.owner,
      name: repositories.name,
    })
    .from(repositories)
    .where(
      and(
        eq(repositories.manuallyExcluded, false),
        eq(repositories.archived, false),
        eq(repositories.private, false),
        ne(repositories.syncStatus, 'disabled'),
      ),
    )
}

// Pick up newly published projects without inventing a GitHub node ID or
// requiring an editor to register the same repository in two places.
export async function collectUnlinkedCatalogRepositories(
  collect: (coordinate: string) => Promise<unknown>,
) {
  const db = getDb()
  const links = await db
    .select({ projectId: projects.id, url: projectLinks.url })
    .from(projects)
    .innerJoin(projectLinks, eq(projectLinks.projectId, projects.id))
    .where(
      and(
        eq(projects.status, 'published'),
        eq(projectLinks.kind, 'repository'),
      ),
    )
  const results: Array<{ coordinate: string; error?: string }> = []
  for (const link of links) {
    const match =
      /^https:\/\/github\.com\/([a-z0-9-]+)\/([a-z0-9_.-]+)\/?$/i.exec(link.url)
    if (!match) continue
    const owner = match[1].toLowerCase()
    const name = match[2].replace(/\.git$/i, '').toLowerCase()
    const coordinate = `${owner}/${name}`
    const existingLink = await db.query.projectRepositories.findFirst({
      where: and(
        eq(projectRepositories.projectId, link.projectId),
        eq(projectRepositories.isDefault, true),
      ),
    })
    if (existingLink) continue
    try {
      let repository = await db.query.repositories.findFirst({
        where: and(
          sql`lower(${repositories.owner}) = ${owner}`,
          sql`lower(${repositories.name}) = ${name}`,
        ),
      })
      if (!repository) {
        await collect(coordinate)
        repository = await db.query.repositories.findFirst({
          where: and(
            sql`lower(${repositories.owner}) = ${owner}`,
            sql`lower(${repositories.name}) = ${name}`,
          ),
        })
      }
      if (!repository)
        throw new Error(
          'Repository identity could not be resolved; check the canonical GitHub URL.',
        )
      await db
        .insert(projectRepositories)
        .values({
          projectId: link.projectId,
          repositoryId: repository.id,
          isDefault: true,
        })
        .onConflictDoUpdate({
          target: [
            projectRepositories.projectId,
            projectRepositories.repositoryId,
          ],
          set: { isDefault: true },
        })
      results.push({ coordinate })
    } catch (error) {
      results.push({
        coordinate,
        error:
          error instanceof Error
            ? error.message
            : 'Repository discovery failed',
      })
    }
  }
  return results
}

export async function recordCollectionFailure(
  repositoryId: string,
  message: string,
  attemptedAt = new Date(),
) {
  const unavailable = message.includes('was not found')
  await getDb()
    .update(repositories)
    .set({
      lastAttemptAt: attemptedAt,
      syncStatus: unavailable ? 'disabled' : 'failed',
      lastError: message.slice(0, 1_000),
      consecutiveFailures: sql`${repositories.consecutiveFailures} + 1`,
    })
    .where(eq(repositories.id, repositoryId))
}

export async function withCollectorLease<T>(
  name: string,
  work: () => Promise<T>,
) {
  const client: PoolClient = await getPool().connect()
  try {
    const lease = await client.query<{ acquired: boolean }>(
      'select pg_try_advisory_lock(hashtext($1)) as acquired',
      [name],
    )
    if (!lease.rows[0]?.acquired)
      throw new Error(`Collector lease ${name} is already held`)

    try {
      return await work()
    } finally {
      await client.query('select pg_advisory_unlock(hashtext($1))', [name])
    }
  } finally {
    client.release()
  }
}
