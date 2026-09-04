# Phase 0 runbook

This spike proves the risky integration boundaries before product work expands. The selected production shape is Vercel's Node runtime via Nitro, Supabase Postgres through its transaction pooler, Better Auth, Resend, Supabase Storage, and the GitHub REST API.

## What runs without provider credentials

```sh
pnpm install
pnpm verify
pnpm dev
```

Open `http://localhost:3000`. Use both oRPC buttons, then request an unknown path and confirm it returns the 404 page. `GET /api/health` deliberately returns 503 until `DATABASE_URL` is configured.

## Provider setup

Copy `.env.example` to `.env` and replace every placeholder used by the check you are running. Never commit `.env`.

1. Create a Supabase project. Use the Supavisor transaction-pool URL on port 6543 for `DATABASE_URL`, with TLS required.
2. Run `pnpm db:migrate` to apply the reviewed Drizzle migration.
3. Create GitHub and Google OAuth apps. Register `${BETTER_AUTH_URL}/api/auth/callback/github` and `${BETTER_AUTH_URL}/api/auth/callback/google`.
4. Verify a Resend sender domain and set `RESEND_API_KEY` plus `EMAIL_FROM`.
5. Create a public Supabase Storage bucket named `assets` and set the service-role key only in the server environment.
6. Generate `CRON_SECRET` and configure it as the Vercel cron bearer secret.

## External checks

Database:

```sh
curl -i http://localhost:3000/api/health
```

GitHub collection (stores a snapshot; requires migrated database):

```sh
pnpm github:sync tanstack/router
pnpm github:sync tanstack/router
```

The second run should send the saved ETag. A `304` updates sync health without inserting a duplicate snapshot.

Asset transform and optional upload:

```sh
pnpm asset:process tests/fixtures/phase-zero-logo.svg logo
```

Without Supabase Storage variables this writes local derivatives plus a provenance manifest. With the variables set it also uploads them under `phase-zero/`.

Auth:

- `GET /api/auth/ok` returns Better Auth's health response.
- Exercise one OAuth provider, logout, email OTP send, invalid OTP, successful OTP, and resend throttling.
- In the deployed preview, confirm cookies are `Secure`, `HttpOnly`, and `SameSite=Lax`, and callback URLs stay on the preview origin.

Deployment:

```sh
pnpm build
pnpm start
```

Import the repository into Vercel, add the environment variables without a `VITE_` prefix, and deploy. Confirm complete HTML is returned with JavaScript disabled and an unknown URL has status 404.

## Exit gate

The code-level checks are automated by `pnpm verify`. Phase 0 is fully signed off only after the deployed preview passes database, OAuth/OTP, cron, image upload/CDN, cookie, environment, streaming SSR, and 404 checks. Record the preview URL and results in this file or the deployment tracker before beginning Phase 1.
