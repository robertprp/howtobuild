# HowToBuild.dev

Phase 3 adds sourced, opinionated technology stacks and the public-beta trust and observability layer to the existing discovery and GitHub intelligence foundation.

## Run locally

Requirements: Node 22–26, pnpm 9, and Postgres.

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm editor:invite you@example.com admin
pnpm dev
```

Open `http://localhost:3000`. The migrations install 39 representative published projects across all six categories. Search at `/search`, inspect momentum at `/trending`, and use `/admin/metrics` to review freshness or exclude a repository from automatic ranking.

## Included through Phase 3

- A stack directory and four launch stack guides with responsibility maps, rationale, cost and open-source profiles, alternatives, tradeoffs, and sources
- Stack-aware search, homepage recommendations, project-to-stack connections, canonical metadata, and sitemap entries
- Methodology, About, corrections, privacy, and terms pages
- Optional web analytics plus first-party browser error and Core Web Vitals collection with an optional production ingest sink

- Full-document SSR search, filters, trending, six categories, and permanent ecosystem routes
- Weighted Postgres full-text search with a GIN index, aliases, and privacy-preserving zero-result aggregation
- Serial GitHub collection with ETags, retries, redirects, normalized observations, and repository health
- Versioned 7/30-day momentum evidence with confidence, activity, category normalization, and anomaly flags
- Public evidence labels plus stale, anomalous, and manually excluded ranking guards
- Private metric-health controls with reasoned audit events
- A 39-project sourced private-alpha catalog
- Project, category, facet, source, link, repository, asset, role, redirect, revision, and audit schema
- Invite-only Better Auth accounts with server-side editor/admin authorization
- Transactional draft, revision, publish, unpublish, and slug-redirect workflows
- Private, `noindex` previews that never enter public queries or the sitemap
- Canonical metadata, Open Graph metadata, XML sitemap, robots rules, redirects, and real 404s
- Self-hosted Fraunces and IBM Plex fonts, design tokens, responsive layouts, visible focus, and reduced-motion behavior
- Trending-row, editorial-feature, stack-item, and search-result content variants
- Provenance-aware AVIF/WebP/JPEG image manifests and responsive derivatives

Run the complete code-level gate with:

```sh
pnpm verify
```

Provider and deployment checks are documented in [the Phase 3 runbook](docs/phase-3-runbook.md). Earlier setup remains in the Phase 0, Phase 1, and Phase 2 runbooks.

Each implementation phase must add a matching `docs/phase-N-runbook.md` containing setup instructions, verification steps, the phase exit gate, and a place to record deployed validation results.
