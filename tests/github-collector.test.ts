import { describe, expect, it, vi } from 'vitest'

import { collectGitHubRepository } from '../src/features/github/collector'
import type { SnapshotStore } from '../src/features/github/collector'

function createStore(
  repository: { id: string; etag: string | null } | null = null,
) {
  return {
    findRepository: vi.fn(async () => repository),
    markNotModified: vi.fn(async () => undefined),
    appendSnapshot: vi.fn(async () => undefined),
  } satisfies SnapshotStore
}

describe('GitHub collector', () => {
  it('stores an append-only aggregate observation and latest release', async () => {
    const store = createStore()
    const responses = [
      new Response(
        JSON.stringify({
          node_id: 'R_123',
          stargazers_count: 420,
          forks_count: 21,
          open_issues_count: 3,
          pushed_at: '2026-09-03T12:00:00Z',
        }),
        { status: 200, headers: { etag: '"repo-v1"' } },
      ),
      new Response(JSON.stringify({ published_at: '2026-09-01T09:00:00Z' })),
    ]

    const result = await collectGitHubRepository(
      'acme/rocket',
      'token',
      store,
      {
        fetch: vi.fn(async () => responses.shift()!),
        now: () => new Date('2026-09-04T08:00:00Z'),
      },
    )

    expect(result).toEqual({
      status: 'stored',
      observedAt: '2026-09-04T08:00:00.000Z',
      stars: 420,
    })
    expect(store.appendSnapshot).toHaveBeenCalledOnce()
    expect(store.appendSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        observation: expect.objectContaining({
          latestReleaseAt: new Date('2026-09-01T09:00:00Z'),
        }),
      }),
    )
  })

  it('reuses an ETag and does not append a duplicate observation on 304', async () => {
    const store = createStore({ id: 'repository-1', etag: '"repo-v1"' })
    const request = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        expect(new Headers(init?.headers).get('if-none-match')).toBe(
          '"repo-v1"',
        )
        return new Response(null, { status: 304 })
      },
    )

    const result = await collectGitHubRepository(
      'acme/rocket',
      'token',
      store,
      {
        fetch: request,
        now: () => new Date('2026-09-04T08:00:00Z'),
      },
    )

    expect(result.status).toBe('not-modified')
    expect(store.markNotModified).toHaveBeenCalledWith(
      'repository-1',
      new Date('2026-09-04T08:00:00Z'),
    )
    expect(store.appendSnapshot).not.toHaveBeenCalled()
  })

  it('honors retry-after for a rate-limited request', async () => {
    const store = createStore()
    const sleep = vi.fn(async () => undefined)
    const responses = [
      new Response(null, { status: 429, headers: { 'retry-after': '2' } }),
      new Response(
        JSON.stringify({
          node_id: 'R_123',
          stargazers_count: 1,
          forks_count: 0,
          open_issues_count: 0,
          pushed_at: null,
        }),
      ),
      new Response(null, { status: 404 }),
    ]

    await collectGitHubRepository('acme/rocket', 'token', store, {
      fetch: vi.fn(async () => responses.shift()!),
      sleep,
    })

    expect(sleep).toHaveBeenCalledWith(2_000)
    expect(store.appendSnapshot).toHaveBeenCalledOnce()
  })
})
