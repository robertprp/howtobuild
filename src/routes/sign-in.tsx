import { useSignInSocial } from '@better-auth-ui/react'
import { createFileRoute } from '@tanstack/react-router'
import { Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { authClient } from '../lib/auth-client'
import { safeReturnPath } from '../lib/return-path'
import { getSignInOptions } from '../features/contributions/sign-in.functions'

export const Route = createFileRoute('/sign-in')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { next: string; error?: string } => ({
    next: safeReturnPath(search.next),
    error:
      typeof search.error === 'string'
        ? 'Sign-in could not be completed. Try again or use another method.'
        : undefined,
  }),
  loader: () => getSignInOptions(),
  head: () => ({
    meta: [
      { title: 'Sign in — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SignInPage,
})

function SignInPage() {
  const { next: requestedNext, error: callbackError } = Route.useSearch()
  const options = Route.useLoaderData()
  const next = requestedNext
  const social = useSignInSocial(authClient)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState(
    'We will email you a one-time sign-in code. No password required.',
  )
  const [busy, setBusy] = useState(false)

  async function sendOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      })
      if (result.error)
        setMessage(result.error.message ?? 'The code could not be sent.')
      else {
        setSent(true)
        setMessage('Check your inbox for the six-digit code.')
      }
    } catch {
      setMessage('Could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await authClient.signIn.emailOtp({ email, otp })
      if (result.error)
        setMessage(result.error.message ?? 'That code was not accepted.')
      else window.location.assign(next)
    } catch {
      setMessage('Could not verify the code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page shell">
      <section>
        <p className="eyebrow">Community account</p>
        <h1>Sign in to contribute.</h1>
        <p className="lede">
          Submit projects, suggest factual updates, and follow moderation
          status. Publishing remains an editor-only decision.
        </p>
      </section>
      <section className="auth-panel" aria-label="Account sign in">
        <div className="auth-assurance">
          <ShieldCheck aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>Secure account access</span>
        </div>
        <button
          className="provider-button provider-github"
          onClick={() =>
            social.mutate({ provider: 'github', callbackURL: next })
          }
          disabled={social.isPending || busy || !options.github}
        >
          <img src="/assets/github-mark.svg" alt="" aria-hidden="true" />
          Continue with GitHub
        </button>
        <button
          className="provider-button provider-google"
          onClick={() =>
            social.mutate({ provider: 'google', callbackURL: next })
          }
          disabled={social.isPending || busy || !options.google}
        >
          <span className="google-mark">
            <img src="/assets/google-g.svg" alt="" aria-hidden="true" />
          </span>
          Continue with Google
        </button>
        <span className="auth-divider">or continue with email</span>
        <form onSubmit={sent ? verifyOtp : sendOtp}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={sent}
            />
          </label>
          {sent ? (
            <label>
              Verification code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </label>
          ) : null}
          <button
            className="button wide"
            type="submit"
            disabled={busy || social.isPending || !options.email}
          >
            {!busy && !sent ? <Mail aria-hidden="true" size={18} /> : null}
            {busy
              ? 'Working…'
              : sent
                ? 'Verify and continue'
                : 'Email me a code'}
          </button>
        </form>
        {sent ? (
          <div className="auth-retry">
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={sendOtp}
            >
              Resend code
            </button>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setSent(false)
                setOtp('')
                setMessage('Enter the email address you want to use.')
              }}
            >
              Change email
            </button>
          </div>
        ) : null}
        {!options.github || !options.google || !options.email ? (
          <p className="form-message">
            Some sign-in methods are not available on this deployment.
          </p>
        ) : null}
        <p className="form-message" role="alert">
          {social.error?.message || callbackError}
        </p>
        <p className="form-message" aria-live="polite">
          {message}
        </p>
      </section>
    </main>
  )
}
