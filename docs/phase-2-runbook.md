# Phase 2 discovery and GitHub intelligence runbook

This runbook covers the Phase 2 implementation: permanent discovery routes, Postgres full-text search, catalog-wide GitHub collection, historical snapshots, transparent momentum, and repository health controls.

## Setup

Use the already configured application database. Do not create or start a database as part of verification.

```sh
pnpm install
pnpm db:migrate
pnpm dev
```

Migration `0004` adds the weighted generated search document and GIN index, aliases, aggregate zero-result counters, repository health and exclusion state, versioned momentum evidence, repository links, facet landing-page content, and a 39-project private-alpha catalog.

## Discovery review

- Visit `/search` and try `React`, `auth`, `TypeScript backend`, `AI coding`, `observability`, `Postgres`, and `free hosting`.
- Apply category, ecosystem, open-source, and self-hostable filters. Exact names must remain ahead of editorial or momentum boosts.
- Confirm zero-result searches show a useful empty state and increment an aggregate query hash without storing IP addresses.
- Visit all six categories and representative ecosystem routes. Their initial HTML must contain authored context and crawlable project links.
- Confirm `/search` emits `noindex, follow`, while canonical categories, ecosystems, projects, and weekly/monthly trending views appear in the sitemap.

## GitHub collection

Configure `GITHUB_TOKEN`, then collect all active catalog repositories serially under one advisory lock:

```sh
pnpm github:sync
```

Passing `owner/name` limits the CLI invocation to one repository:

```sh
pnpm github:sync tanstack/router
```

Verify that `200` responses append aggregate observations, later `304` responses reuse the ETag and append the normalized last-good observation, redirects update repository coordinates, and retryable failures honor `Retry-After` or exponential backoff. Failures must update health without deleting historical snapshots.

Weekly momentum requires observations spanning at least five days; monthly momentum requires 21 days. The UI must label incomplete windows and never extrapolate. Each stored calculation records its baseline/current snapshot IDs, evidence dates, confidence, anomaly reasons, and algorithm version.

## Trending and metric health

- Review `/trending` and `/trending?period=month`. The UI shows evidence rather than the internal score.
- Review `/admin/metrics` as an invited editor. Healthy is at most 30 hours old, Delayed is 30–72 hours, Stale is over 72 hours, and archived/private/manual exclusions are Disabled.
- Exclude and restore a repository with an editorial reason. Both changes must create audit events, and excluded repositories must not rank automatically.

## Build gate

```sh
pnpm typecheck
pnpm build
```

Manual release checks remain required for keyboard navigation, visible focus, 200% zoom, 320 CSS px reflow, reduced motion, production search latency, the deployed cron, and five moderated developer discovery sessions.

## Exit gate record

**Preview URL:**  
**Migration applied:** Pending deployed-provider validation.  
**Collector run:** Pending deployed-provider validation.  
**Search p95:** Pending deployed-provider validation.  
**Accessibility review:** Pending.  
**Moderated sessions:** Pending (0/5 recorded).  
**Result:** Code build passes; deployed-provider and moderated validation remain pending.
