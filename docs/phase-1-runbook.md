# Phase 1 editorial vertical slice runbook

This runbook verifies the Phase 1 exit gate: an invited editor can publish a sourced project without a code change or deployment, public pages arrive as complete HTML, and drafts stay private.

## Setup

Configure `.env`, apply migrations, and create a seven-day editor invitation:

```sh
pnpm db:migrate
pnpm editor:invite editor@example.com admin
pnpm dev
```

The Phase 1 migration seeds 12 reviewed examples—two in each of Frontend, Backend, Mobile, DevOps, Observability, and AI Tools. Seed records use official maintainer or repository URLs and intentionally omit Phase 2 momentum claims.

## Editorial workflow

1. Visit `/sign-in` and authenticate with the exact invited email through GitHub, Google, or email OTP.
2. Confirm a non-invited new identity receives the generic invite-only error and cannot create an account.
3. Visit `/admin/projects/new`, complete every editorial, cost, link, source, and revision-note field, then save.
4. Confirm the draft appears on the desk but `/projects/{slug}` returns 404.
5. Open `/preview/{slug}` while signed in. Confirm the complete draft renders with a private-preview banner and `noindex, nofollow` metadata.
6. Open the preview signed out or in a private browser. Confirm it redirects to `/sign-in` and does not reveal draft content.
7. Publish from the editor. Confirm the public URL returns 200 without a redeploy and that the project appears in its category and `/sitemap.xml`.
8. Edit the slug. Confirm the former project URL returns a 301 to the canonical slug.
9. Unpublish. Confirm the public URL returns 404 and disappears from category results and the sitemap while remaining available to editors in preview.
10. Confirm every save, publish, and unpublish created a revision and an audit event with the actor and reason.

## Crawler and SSR checks

Replace the example slug with a published record:

```sh
curl -i http://localhost:3000/projects/react
curl -s http://localhost:3000/projects/react | grep -E '<h1[^>]*>React|rel="canonical"|og:title'
curl -i http://localhost:3000/projects/not-a-real-project
curl -i http://localhost:3000/robots.txt
curl -i http://localhost:3000/sitemap.xml
```

The first response must contain the primary project copy and metadata in its initial HTML. The missing slug must be 404. The sitemap must contain only canonical public category and published-project URLs; it must never contain `/admin`, `/preview`, or a draft slug.

## Asset pipeline

Every production invocation requires a source page and recorded license:

```sh
pnpm asset:process ./source.jpg photo .generated-assets https://example.com/source-page "License reviewed 2026-09-04" "Creator name" "Contextual alt text"
```

Confirm the manifest contains checksum, source page, creator, license, capture date, alt text, focal point, source dimensions, and 480/768/1200/1600 AVIF, WebP, and JPEG derivatives. With Supabase Storage configured, confirm each format is uploaded with its matching content type.

## Exit gate

- `pnpm verify` passes.
- A deployed editor completes draft → private preview → publish → revision → unpublish without code or deployment.
- A signed-out visitor and crawler cannot retrieve draft content through public routes, metadata, redirects, or the sitemap.
- Published pages return complete server-rendered HTML, canonical metadata, and correct 200/301/404 statuses.
- OAuth/OTP, secure-cookie, database, and storage provider checks from the Phase 0 runbook still pass in the deployed environment.

Record the preview URL, editor identity used, test project slug, and results below before starting Phase 2.

**Preview URL:**  
**Editor:**  
**Test project:**  
**Result:** Pending deployed-provider validation.
