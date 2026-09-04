import { and, eq } from 'drizzle-orm'
import type { PoolClient } from 'pg'

import { getDb, getPool } from '../../db/client.server'
import { githubSnapshots, repositories } from '../../db/schema'
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
    await getDb()
      .update(repositories)
      .set({ lastSyncedAt: observedAt, lastError: null })
      .where(eq(repositories.id, repositoryId))
  },

  async appendSnapshot({ observation, etag, observedAt }) {
    await getDb().transaction(async (tx) => {
      const [repository] = await tx
        .insert(repositories)
        .values({
          githubNodeId: observation.nodeId,
          owner: observation.owner,
          name: observation.name,
          etag,
          lastSyncedAt: observedAt,
          lastError: null,
        })
        .onConflictDoUpdate({
          target: repositories.githubNodeId,
          set: { etag, lastSyncedAt: observedAt, lastError: null },
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
        raw: observation.raw,
      })
    })
  },
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
