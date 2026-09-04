export type GitHubRepositoryObservation = {
  nodeId: string
  owner: string
  name: string
  stars: number
  forks: number
  openIssues: number
  pushedAt: Date | null
  latestReleaseAt: Date | null
  htmlUrl: string | null
  defaultBranch: string | null
  archived: boolean
  private: boolean
  raw: Record<string, unknown>
}

export type StoredRepository = {
  id: string
  etag: string | null
}

export interface SnapshotStore {
  findRepository: (
    owner: string,
    name: string,
  ) => Promise<StoredRepository | null>
  markNotModified: (repositoryId: string, observedAt: Date) => Promise<void>
  appendSnapshot: (input: {
    observation: GitHubRepositoryObservation
    etag: string | null
    observedAt: Date
  }) => Promise<void>
}

type CollectorDependencies = {
  fetch?: typeof globalThis.fetch
  sleep?: (milliseconds: number) => Promise<void>
  now?: () => Date
  maxRetries?: number
}

export type CollectionResult =
  | { status: 'stored'; observedAt: string; stars: number }
  | { status: 'not-modified'; observedAt: string }

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

function retryDelay(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1_000
  return Math.min(2 ** attempt * 500, 8_000)
}

async function githubRequest(
  url: string,
  token: string,
  etag: string | null,
  dependencies: Required<
    Pick<CollectorDependencies, 'fetch' | 'sleep' | 'maxRetries'>
  >,
) {
  for (let attempt = 0; attempt <= dependencies.maxRetries; attempt += 1) {
    const response = await dependencies.fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'HowToBuild.dev-collector',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(etag ? { 'If-None-Match': etag } : {}),
      },
    })

    if (response.ok || response.status === 304 || response.status === 404)
      return response

    if (
      attempt < dependencies.maxRetries &&
      [403, 429, 500, 502, 503, 504].includes(response.status)
    ) {
      await dependencies.sleep(retryDelay(response, attempt))
      continue
    }

    throw new Error(`GitHub request failed with ${response.status}`)
  }

  throw new Error('GitHub retry loop exhausted')
}

export async function collectGitHubRepository(
  coordinate: string,
  token: string,
  store: SnapshotStore,
  options: CollectorDependencies = {},
): Promise<CollectionResult> {
  const [owner, name, extra] = coordinate.split('/')
  if (!owner || !name || extra)
    throw new Error('Repository must use owner/name format')

  const dependencies = {
    fetch: options.fetch ?? globalThis.fetch,
    sleep: options.sleep ?? defaultSleep,
    maxRetries: options.maxRetries ?? 3,
  }
  const observedAt = (options.now ?? (() => new Date()))()
  const stored = await store.findRepository(owner, name)
  const repositoryResponse = await githubRequest(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    token,
    stored?.etag ?? null,
    dependencies,
  )

  if (repositoryResponse.status === 304) {
    if (!stored)
      throw new Error('GitHub returned 304 for an unknown repository')
    await store.markNotModified(stored.id, observedAt)
    return { status: 'not-modified', observedAt: observedAt.toISOString() }
  }

  if (repositoryResponse.status === 404)
    throw new Error(`GitHub repository ${coordinate} was not found`)

  const raw = (await repositoryResponse.json()) as Record<string, unknown>
  const releaseResponse = await githubRequest(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases/latest`,
    token,
    null,
    dependencies,
  )
  const release = releaseResponse.ok
    ? ((await releaseResponse.json()) as Record<string, unknown>)
    : null

  const observation: GitHubRepositoryObservation = {
    nodeId: String(raw.node_id),
    owner:
      typeof raw.owner === 'object' && raw.owner && 'login' in raw.owner
        ? String(raw.owner.login)
        : owner,
    name: typeof raw.name === 'string' ? raw.name : name,
    stars: Number(raw.stargazers_count),
    forks: Number(raw.forks_count),
    openIssues: Number(raw.open_issues_count),
    pushedAt: raw.pushed_at ? new Date(String(raw.pushed_at)) : null,
    latestReleaseAt: release?.published_at
      ? new Date(String(release.published_at))
      : null,
    htmlUrl: typeof raw.html_url === 'string' ? raw.html_url : null,
    defaultBranch:
      typeof raw.default_branch === 'string' ? raw.default_branch : null,
    archived: raw.archived === true,
    private: raw.private === true,
    raw,
  }

  if (!observation.nodeId || !Number.isFinite(observation.stars)) {
    throw new Error('GitHub response was missing required aggregate fields')
  }

  await store.appendSnapshot({
    observation,
    etag: repositoryResponse.headers.get('etag'),
    observedAt,
  })

  return {
    status: 'stored',
    observedAt: observedAt.toISOString(),
    stars: observation.stars,
  }
}
