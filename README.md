# HowToBuild.dev

Phase 1 implements the editorial vertical slice: a database-backed field guide, private editor workflow, sourced project publishing, SSR public pages, and crawler controls.

## Run locally

Requirements: Node 22–26, pnpm 9, and Postgres.

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm editor:invite you@example.com admin
pnpm dev
```

Open `http://localhost:3000`. The migration installs 12 representative published projects across all six categories. Sign in with the invited address at `/sign-in`; create a draft at `/admin/projects/new`, preview it privately, and publish it from the editor.

## Included in Phase 1

- Global navigation and a compact, full-document SSR homepage
- Six category routes and sourced project detail pages
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

Provider and deployment checks are documented in [the Phase 1 runbook](docs/phase-1-runbook.md). Phase 0 setup remains in [its original runbook](docs/phase-0-runbook.md).

Each implementation phase must add a matching `docs/phase-N-runbook.md` containing setup instructions, verification steps, the phase exit gate, and a place to record deployed validation results.
