import { createHash } from 'node:crypto'

import { asc, sql } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import { categories, facets, searchZeroResults } from '../../db/schema'
import { listPublishedProjects } from '../editorial/store.server'
import { listPublishedStacks } from '../stacks/store.server'

export type DiscoveryFilters = {
  category?: string
  facet?: string
  type?: string
  pricing?: string
  openSource?: boolean
  selfHostable?: boolean
  signal?: 'trending' | 'recommended' | 'watching'
}

export function normalizeSearchQuery(query: string) {
  return query
    .trim()
    .toLocaleLowerCase('en-US')
    .replaceAll(/\s+/g, ' ')
    .slice(0, 120)
}

async function recordZeroResult(normalizedQuery: string) {
  const queryHash = createHash('sha256').update(normalizedQuery).digest('hex')
  await getDb()
    .insert(searchZeroResults)
    .values({ queryHash, normalizedQuery })
    .onConflictDoUpdate({
      target: searchZeroResults.queryHash,
      set: {
        count: sql`${searchZeroResults.count} + 1`,
        lastSeenAt: new Date(),
      },
    })
}

export async function searchDiscovery(
  rawQuery: string,
  filters: DiscoveryFilters = {},
) {
  const db = getDb()
  const query = normalizeSearchQuery(rawQuery)
  const conditions = [sql`p.status = 'published'`]
  if (filters.category) conditions.push(sql`c.slug = ${filters.category}`)
  if (filters.type)
    conditions.push(sql`lower(p.project_type) = lower(${filters.type})`)
  if (filters.pricing)
    conditions.push(sql`p.pricing_label = ${filters.pricing}`)
  if (filters.openSource !== undefined)
    conditions.push(sql`p.open_source = ${filters.openSource}`)
  if (filters.selfHostable !== undefined)
    conditions.push(sql`p.self_hostable = ${filters.selfHostable}`)
  if (filters.facet)
    conditions.push(sql`exists (
      select 1 from project_facets pf
      join facets f on f.id = pf.facet_id
      where pf.project_id = p.id and f.slug = ${filters.facet}
    )`)
  if (filters.signal === 'recommended') conditions.push(sql`p.recommended`)
  if (filters.signal === 'watching') conditions.push(sql`p.worth_watching`)
  if (filters.signal === 'trending')
    conditions.push(sql`exists (
      select 1 from project_momentum pm
      join project_repositories pr on pr.project_id = p.id and pr.is_default
      join repositories r on r.id = pr.repository_id
      where pm.project_id = p.id and pm.score is not null and not pm.anomaly
        and not r.manually_excluded and not r.archived and not r.private
        and r.last_synced_at >= now() - interval '72 hours'
    )`)

  if (query)
    conditions.push(sql`(
      p.search_document @@ websearch_to_tsquery('english'::regconfig, ${query})
      or exists (
        select 1 from search_aliases sa where sa.project_id = p.id
        and to_tsvector('simple'::regconfig, sa.alias) @@ websearch_to_tsquery('simple'::regconfig, ${query})
      )
    )`)

  const result = await db.execute<{ id: string; rank: number }>(sql`
    select p.id,
      case when ${query} = '' then 0
      else greatest(
        ts_rank_cd(p.search_document, websearch_to_tsquery('english'::regconfig, ${query}), 32),
        case when lower(p.name) = ${query} then 2 else 0 end,
        coalesce((select max(case when sa.normalized_alias = ${query} then 1.5 else 0.6 end)
          from search_aliases sa where sa.project_id = p.id
          and to_tsvector('simple'::regconfig, sa.alias) @@ websearch_to_tsquery('simple'::regconfig, ${query})), 0)
      ) + case when p.recommended then 0.05 else 0 end
      end as rank
    from projects p
    join categories c on c.id = p.category_id
    where ${sql.join(conditions, sql` and `)}
    order by rank desc, p.name asc
    limit 100
  `)
  const rankById = new Map(result.rows.map((row) => [row.id, row.rank]))
  const [publishedProjects, publishedStacks] = await Promise.all([
    listPublishedProjects(),
    listPublishedStacks(),
  ])
  const projects = publishedProjects
    .filter((project) => rankById.has(project.id))
    .sort(
      (a, b) =>
        (rankById.get(b.id) ?? 0) - (rankById.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name),
    )

  const [allCategories, allFacets] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(facets).orderBy(asc(facets.kind), asc(facets.name)),
  ])
  const categoriesMatched = query
    ? allCategories.filter((item) =>
        `${item.name} ${item.description}`.toLowerCase().includes(query),
      )
    : []
  const facetsMatched = query
    ? allFacets
        .filter((item) =>
          `${item.name} ${item.description ?? ''}`
            .toLowerCase()
            .includes(query),
        )
        .map((item) => ({
          ...item,
          categorySlug:
            publishedProjects.find((project) =>
              project.facets.some((facet) => facet.id === item.id),
            )?.category.slug ?? null,
        }))
    : []
  const stackResult = query
    ? await db.execute<{ id: string; rank: number }>(sql`
        select id, greatest(
          ts_rank_cd(search_document, websearch_to_tsquery('english'::regconfig, ${query}), 32),
          case when lower(name) = ${query} then 2 else 0 end
        ) as rank
        from stacks
        where status = 'published'
          and search_document @@ websearch_to_tsquery('english'::regconfig, ${query})
        order by rank desc, name asc
        limit 20
      `)
    : { rows: [] }
  const stackRank = new Map(stackResult.rows.map((row) => [row.id, row.rank]))
  const matchedStacks = publishedStacks
    .filter((stack) => stackRank.has(stack.id))
    .sort(
      (a, b) =>
        (stackRank.get(b.id) ?? 0) - (stackRank.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name),
    )

  if (
    query &&
    projects.length === 0 &&
    categoriesMatched.length === 0 &&
    facetsMatched.length === 0 &&
    matchedStacks.length === 0
  )
    await recordZeroResult(query)

  return {
    query,
    filters,
    projects,
    stacks: matchedStacks,
    categories: categoriesMatched,
    facets: facetsMatched,
    filterOptions: {
      categories: allCategories,
      facets: allFacets,
      projectTypes: [
        ...new Set(publishedProjects.map((project) => project.projectType)),
      ].sort(),
    },
  }
}
