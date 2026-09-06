// Read-only candidate discovery. Search ranking is NOT measured star growth.
export {}
const topic = process.argv[2] ?? 'react-native'
if (!/^[a-z0-9-]{1,50}$/.test(topic))
  throw new Error('Provide a GitHub topic, e.g. flutter or react-native')
const since = new Date(Date.now() - 49 * 86400000).toISOString().slice(0, 10)
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
}
const seen = new Set<string>()
for (const query of [
  `topic:${topic} stars:>=100 archived:false fork:false pushed:>=${since}`,
  `topic:${topic} stars:>=20 archived:false fork:false created:>=${since}`,
]) {
  const response = await fetch(
    `https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: 'stars', order: 'desc', per_page: '30' })}`,
    { headers, signal: AbortSignal.timeout(20_000) },
  )
  if (!response.ok)
    throw new Error(
      `GitHub search failed (${response.status}); retry later or configure GITHUB_TOKEN`,
    )
  const data = (await response.json()) as {
    incomplete_results: boolean
    items: Array<{
      full_name: string
      html_url: string
      description: string | null
      stargazers_count: number
      pushed_at: string
      created_at: string
      license: { spdx_id: string } | null
    }>
  }
  console.log(
    JSON.stringify(
      {
        query,
        checkedAt: new Date().toISOString(),
        incomplete: data.incomplete_results,
        note: 'Review candidates before publication. Total stars and recent pushes do not establish 7-day or 49-day star growth.',
        candidates: data.items
          .filter((item) => {
            if (seen.has(item.full_name)) return false
            seen.add(item.full_name)
            return true
          })
          .map((item) => ({
            repository: item.full_name,
            url: item.html_url,
            description: item.description,
            totalStars: item.stargazers_count,
            pushedAt: item.pushed_at,
            createdAt: item.created_at,
            license: item.license?.spdx_id ?? 'Needs review',
            growth49d: null,
          })),
      },
      null,
      2,
    ),
  )
}
