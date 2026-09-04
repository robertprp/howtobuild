import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'

import { orpc } from '../lib/orpc-client'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const health = useQuery({
    ...orpc.system.health.queryOptions(),
    enabled: false,
  })
  const echo = useMutation(orpc.system.echo.mutationOptions())

  return (
    <main>
      <section className="hero shell">
        <div>
          <p className="eyebrow">HowToBuild.dev · Phase 0</p>
          <h1>The risky seams, made testable.</h1>
          <p className="lede">
            A production-shaped spike for SSR, oRPC, Better Auth, Supabase
            Postgres, scheduled GitHub collection, and managed assets.
          </p>
          <div className="actions">
            <button className="button" onClick={() => health.refetch()}>
              Test oRPC query
            </button>
            <button
              className="button secondary"
              onClick={() => echo.mutate({ message: 'Phase zero is alive' })}
            >
              Test oRPC mutation
            </button>
          </div>
          <output className="result" aria-live="polite">
            {health.data
              ? `Query: ${health.data.runtime} responded at ${health.data.checkedAt}`
              : echo.data
                ? `Mutation: ${echo.data.normalized}`
                : health.error || echo.error
                  ? `Request failed: ${(health.error ?? echo.error)?.message}`
                  : 'Run either check to exercise the typed Fetch adapter.'}
          </output>
        </div>
        <aside className="signal" aria-label="Phase status">
          <span>Vertical slice</span>
          <strong>Ready locally</strong>
          <small>
            Provider checks activate when environment values are supplied.
          </small>
        </aside>
      </section>

      <section className="shell section">
        <p className="eyebrow">Seam map</p>
        <div className="grid">
          {[
            [
              'SSR + streaming',
              'TanStack Start on Nitro, with a Vercel production preset.',
            ],
            [
              'Typed application API',
              'oRPC query and mutation through a catch-all server route.',
            ],
            [
              'Identity',
              'Better Auth, social providers, hashed email OTPs, and secure cookies.',
            ],
            [
              'Source of truth',
              'Drizzle migrations against Supabase Postgres via a small pool.',
            ],
            [
              'Signals',
              'Authenticated GitHub aggregate snapshots with ETag reuse and a DB lease.',
            ],
            [
              'Assets',
              'Sharp derivatives uploaded to a public Supabase Storage bucket.',
            ],
          ].map(([title, copy], index) => (
            <article className="card" key={title}>
              <span>0{index + 1}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell decisions">
        <div>
          <p className="eyebrow">Provider decisions</p>
          <h2>Small, replaceable boundaries.</h2>
        </div>
        <dl>
          <div>
            <dt>Runtime</dt>
            <dd>Vercel Node / Nitro</dd>
          </div>
          <div>
            <dt>Database</dt>
            <dd>Supabase Postgres + Supavisor</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>Resend</dd>
          </div>
          <div>
            <dt>Images</dt>
            <dd>Supabase Storage</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
