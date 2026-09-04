# HowToBuild.dev

Phase 0 production-shaped spike for the research-backed implementation plan.

## Run locally

Requirements: Node 22–26 and pnpm 9.

```sh
pnpm install
pnpm verify
pnpm dev
```

Open `http://localhost:3000` and use both API test buttons. The public page renders without provider credentials; provider-backed endpoints report their missing configuration rather than exposing secrets.

## Included in Phase 0

- TanStack Start full-document SSR on Nitro, configured for Vercel
- oRPC Fetch adapter with a typed query and mutation, exercised through TanStack Query
- Better Auth with GitHub/Google provider wiring, hashed email OTPs, rate limits, and TanStack cookie handling
- Better Auth UI's React provider as the UI integration boundary
- Drizzle/Postgres schema and migrations, including auth tables generated against Better Auth 1.7.2
- GitHub aggregate collector with authentication, conditional ETags, rate-limit retry, advisory locking, and append-only snapshots
- Sharp asset derivatives, provenance manifest, and optional Supabase Storage upload
- Automated tests plus type and production build verification

The dependency graph is exact-pinned in `package.json` and `pnpm-lock.yaml` because TanStack Start remains an RC dependency.

## Provider validation

Phase 0's external checks need project credentials. Copy `.env.example` to `.env`, then follow [the Phase 0 runbook](docs/phase-0-runbook.md) for Supabase, OAuth, Resend, GitHub, Supabase Storage, cron, and deployment validation.

Do not begin Phase 1 until the deployed exit gate in the runbook is recorded as passing.
