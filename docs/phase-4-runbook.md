# Phase 4 community contribution runbook

This runbook covers public accounts, project submissions, edit suggestions, status tracking, moderation, duplicate and spam controls, and abuse reporting.

## Setup

Use the already configured database. Do not create, start, reset, or otherwise initialize a database during verification.

```sh
pnpm install
pnpm db:migrate
pnpm dev
```

Migration `0006` adds immutable submission and edit-suggestion payloads, moderation events, privacy-preserving rate-limit counters, and abuse reports. Configure a dedicated random `CONTRIBUTION_HASH_SECRET`; changing it resets the effective IP rate-limit identities.

Migration `0007` adds the submission-to-editorial-draft link, 49-day star-growth evidence and per-period dates, and researched stack starter options. These migrations were generated, not applied during implementation. `dev`, `build`, and `start` do not migrate automatically. Apply pending migrations explicitly to the intended existing database before serving the updated code.

Google, GitHub, email, Better Auth, and Resend variables remain required for their corresponding sign-in methods.

## Contribution review

- Create a normal, non-editor account with each configured provider and confirm it can access `/account`, `/submit`, and `/account/submissions` but not `/admin`.
- Load canonical repository metadata, review it, and submit a project. Subpages, non-GitHub hosts, existing catalog repositories, and active duplicate submissions must be rejected.
- Suggest an edit from a published project. Confirm the source is required and the public project remains unchanged.
- Confirm status and moderation reasons are visible only to the submitting account and editors.
- As an editor, move submissions and suggestions through Under review, Changes requested, Approved, and Rejected with a required reason.
- Confirm approval does not publish or mutate a project. Publication remains a separate editor workflow.
- Request changes, sign back in as the contributor, and send a response from `/account/submissions`. The original payload must remain unchanged, the response must appear in the event history, and the item must return to Submitted.
- Approve a project submission, choose Prepare editorial draft, independently verify sources/pricing/licensing, fill the required editorial fields, save, then publish. Only publication marks the linked submission Published. Repeating Prepare draft must reopen the same project.
- Approve an edit suggestion, save the correction through the project editor, then mark it applied with a note. The completion event references the editorial revision; approving alone never changes public content.
- Submit an abuse report and confirm it appears in the editor queue.
- Resolve a report with a required note and verify the audit event. Revoke another active session from `/account`, then confirm that session no longer authenticates.

## Abuse controls

Set `TRUSTED_CLIENT_IP_HEADER` to a header your production proxy **overwrites**, never one a client can supply unchanged. The default is `x-forwarded-for` (first address). Contribution counters store an HMAC, not the raw IP; Better Auth session records may separately retain IP/browser metadata. Missing or invalid contribution IPs share an `unknown` bucket. Exercise account and IP limits, hidden honeypots, minimum-fill timing, strict GitHub URLs, duplicate repository detection, and identical edit fingerprints. Counters are shared, atomic Postgres upserts so limits survive worker restarts. Include expiry-based counter cleanup in the operational retention plan.

Provider-level auth throttling remains enabled in Better Auth. Review OAuth redirect URLs, OTP expiry, allowed attempts, and Resend delivery before release.

Email OTP expires after ten minutes with five allowed attempts, plus per-email send quotas. Publish the existing Resend template `how-to-build-generic` before testing delivery. Only configured sign-in methods are enabled in the UI. Verify untrusted `next` redirect values cannot leave this origin. Public signup grants no editor role; editor invitations require a verified matching email.

## Stack starter

After migrating, open `/stacks/modern-typescript-saas` and `/stacks/ai-saas`. The purpose section now leads into a public, dark Markdown prompt preview. Edit the product brief, choose Better Auth or Clerk, and select shadcn/ui, Mantine, or the original styling choice where present. Copy and `.md` download must include exactly the selected technologies and their integration notes. Switch the framework from Next.js to Astro on the TypeScript stack: Next.js-specific supplemental options must disappear and no stale Clerk or UI choice should remain in the prompt.

Other stack pages use their existing responsibility maps and editorial alternatives. New integration options require explicit reviewed data; they are not an unrestricted compatibility matrix. Official sources and the rationale behind the initial options are recorded in [stack starter research](stack-starter-research.md). No Clerk, Mantine, or shadcn runtime dependency is needed in this website: these are choices for the user's generated project, not a replacement for this site's design system.

## Star-growth indexing

The existing scheduled collector now discovers unlinked GitHub repository URLs on published catalog projects and attaches verified GitHub identities before calculating momentum. Existing exclusions remain authoritative. Run `pnpm github:sync` with `GITHUB_TOKEN` to collect manually, or use the existing protected scheduled job. Do not run it as an offline verification check: it writes real observations to the configured database.

`/trending?period=seven-weeks` sorts eligible projects by net stars gained, with ties by name. Weekly and monthly tabs also sort by their selected star delta. This only ranks the curated catalog, not every repository on GitHub. Daily observations are required: a 49-day window needs a baseline 46–52 days before the latest snapshot. Missing history stays unranked; we do not backfill imaginary observations from today's lifetime count. Stale, excluded, private, archived, and anomalous data are not ranked. Verify the actual displayed dates and the early-signal state after applying the migrations.

## Code gate

```sh
pnpm typecheck
pnpm test
pnpm build
```

No new tests are added under the workspace policy. The existing suite and build validate regressions; the abuse and moderation exit gate still requires deployed manual verification.

## Exit gate record

**Preview URL:**  
**Migration applied:** Pending deployed-provider validation.  
**Google/GitHub/email flows:** Pending.  
**Account/IP abuse controls:** Pending.  
**Submission and suggestion moderation:** Pending.  
**Starter copy/download and responsive browser check:** Pending migrated-preview validation.  
**49-day ranking:** Pending real observation history.  
**No direct publication confirmed:** Pending.  
**Result:** Code implementation complete; deployed auth, abuse, and moderation validation remain pending.
