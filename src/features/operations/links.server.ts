import { createHash } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { getDb } from '../../db/client.server'
import {
  linkChecks,
  projectLinks,
  projectSources,
  projects,
} from '../../db/schema'
import { checkPublishedLink } from './link-check.server'

function urlHash(url: string) {
  return createHash('sha256').update(url).digest('hex')
}

async function publishedLinks() {
  const db = getDb()
  const [links, sources] = await Promise.all([
    db
      .select({
        url: projectLinks.url,
        slug: projects.slug,
        name: projects.name,
      })
      .from(projectLinks)
      .innerJoin(projects, eq(projects.id, projectLinks.projectId))
      .where(eq(projects.status, 'published')),
    db
      .select({
        url: projectSources.url,
        slug: projects.slug,
        name: projects.name,
      })
      .from(projectSources)
      .innerJoin(projects, eq(projects.id, projectSources.projectId))
      .where(eq(projects.status, 'published')),
  ])
  const unique = new Map<
    string,
    {
      hash: string
      url: string
      projects: Array<{ slug: string; name: string }>
    }
  >()
  for (const item of [...links, ...sources]) {
    const hash = urlHash(item.url)
    const entry = unique.get(hash) ?? { hash, url: item.url, projects: [] }
    if (!entry.projects.some((project) => project.slug === item.slug))
      entry.projects.push({ slug: item.slug, name: item.name })
    unique.set(hash, entry)
  }
  return [...unique.values()]
}

export async function getLinkReport() {
  const links = await publishedLinks()
  const checks = links.length
    ? await getDb()
        .select()
        .from(linkChecks)
        .where(
          inArray(
            linkChecks.urlHash,
            links.map((link) => link.hash),
          ),
        )
    : []
  const byHash = new Map(checks.map((check) => [check.urlHash, check]))
  return links
    .map((link) => {
      const check = byHash.get(link.hash)
      return {
        ...link,
        check: check
          ? {
              status: check.status,
              httpStatus: check.httpStatus,
              detail: check.detail,
              checkedAt: check.checkedAt.toISOString(),
            }
          : null,
      }
    })
    .sort(
      (a, b) =>
        (a.check?.checkedAt ?? '').localeCompare(b.check?.checkedAt ?? '') ||
        a.url.localeCompare(b.url),
    )
}

export async function collectLinkChecks() {
  // Four workers, at most forty URLs, and a deadline for starting new work.
  // Least recently checked first gives all catalog links a turn.
  const due = (await getLinkReport())
    .filter(
      (item) =>
        !item.check ||
        Date.now() - new Date(item.check.checkedAt).getTime() >= 86_400_000,
    )
    .slice(0, 40)
  const deadline = Date.now() + 40_000
  let cursor = 0
  let checked = 0
  async function worker() {
    while (cursor < due.length && Date.now() < deadline) {
      const item = due[cursor++]
      const check = await checkPublishedLink(item.url)
      const values = {
        urlHash: item.hash,
        url: item.url,
        ...check,
        checkedAt: new Date(),
      }
      await getDb()
        .insert(linkChecks)
        .values(values)
        .onConflictDoUpdate({ target: linkChecks.urlHash, set: values })
      checked++
    }
  }
  // Keep the collector lease until every worker stops, even on a DB failure.
  const outcomes = await Promise.allSettled(
    Array.from({ length: 4 }, () => worker()),
  )
  if (outcomes.some((outcome) => outcome.status === 'rejected'))
    throw new Error('Link result persistence failed')
  return { checked, deferred: due.length - checked }
}
