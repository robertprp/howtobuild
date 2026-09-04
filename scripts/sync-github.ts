import { collectGitHubRepository } from '../src/features/github/collector'
import {
  postgresSnapshotStore,
  withCollectorLease,
} from '../src/features/github/store.server'

const token = process.env.GITHUB_TOKEN
if (!token) throw new Error('GITHUB_TOKEN is required')

const coordinate =
  process.argv.at(2) ?? process.env.GITHUB_REPOSITORY ?? 'tanstack/router'
const result = await withCollectorLease('github-collector', () =>
  collectGitHubRepository(coordinate, token, postgresSnapshotStore),
)

console.log(JSON.stringify(result, null, 2))
