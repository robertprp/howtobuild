import { collectGitHubRepository } from './collector'
import { calculateAndStoreMomentum } from './momentum.server'
import {
  listCollectableRepositories,
  postgresSnapshotStore,
  recordCollectionFailure,
  collectUnlinkedCatalogRepositories,
} from './store.server'

export async function collectCatalogRepositories(token: string) {
  const discovery = await collectUnlinkedCatalogRepositories((coordinate) =>
    collectGitHubRepository(coordinate, token, postgresSnapshotStore),
  )
  const repositories = await listCollectableRepositories()
  const results: Array<{
    coordinate: string
    status: 'stored' | 'not-modified' | 'failed'
    error?: string
  }> = []

  for (const repository of repositories) {
    const coordinate = `${repository.owner}/${repository.name}`
    try {
      const result = await collectGitHubRepository(
        coordinate,
        token,
        postgresSnapshotStore,
      )
      results.push({ coordinate, status: result.status })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      await recordCollectionFailure(repository.id, message)
      results.push({ coordinate, status: 'failed', error: message })
    }
  }

  const momentum = await calculateAndStoreMomentum()
  return {
    attempted: repositories.length,
    succeeded: results.filter((result) => result.status !== 'failed').length,
    failed: results.filter((result) => result.status === 'failed').length,
    momentum,
    discovery,
    results,
  }
}
