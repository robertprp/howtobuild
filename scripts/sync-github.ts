import { collectGitHubRepository } from '../src/features/github/collector'
import {
  postgresSnapshotStore,
  withCollectorLease,
} from '../src/features/github/store.server'
import { collectCatalogRepositories } from '../src/features/github/sync.server'

const token = process.env.GITHUB_TOKEN
if (!token) throw new Error('GITHUB_TOKEN is required')

const coordinate = process.argv.at(2)
const result = coordinate
  ? await withCollectorLease('github-collector', () =>
      collectGitHubRepository(coordinate, token, postgresSnapshotStore),
    )
  : await withCollectorLease('github-collector', () =>
      collectCatalogRepositories(token),
    )

console.log(JSON.stringify(result, null, 2))
