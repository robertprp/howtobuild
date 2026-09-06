import { useSignInSocial } from '@better-auth-ui/react'
import { createFileRoute } from '@tanstack/react-router'
import { Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
      { title: 'Sign in or create an account — HowToBuild.dev' },
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
    'We will email you a one-time code to sign in or create your account. No password or invitation required.',
  )
  const [busy, setBusy] = useState(false)
  const otpInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (sent) otpInput.current?.focus()
  }, [sent])

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
        <h1>Join the community.</h1>
        <p className="lede">
          Everyone can create an account—no invitation needed. Submit projects,
          suggest factual updates, and follow moderation status. Publishing
          remains an editor-only decision.
        </p>
      </section>
      <section className="auth-panel" aria-label="Sign in or create an account">
        <div className="auth-assurance">
          <ShieldCheck aria-hidden="true" size={20} strokeWidth={1.8} />
          <span>Sign in or create a free account</span>
        </div>
        <p className="form-message">
          New here? Your first successful sign-in creates your account. Already
          a member? Use the same method to return.
        </p>
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
              disabled={sent || busy}
            />
          </label>
          {sent ? (
            <label>
              Verification code
              <input
                inputMode="numeric"
                ref={otpInput}
                aria-describedby="otp-status"
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
        <p id="otp-status" className="form-message" aria-live="polite">
          {message}
        </p>
        <p className="form-message">
          Read our <a href="/terms">Terms</a> and{' '}
          <a href="/privacy">Privacy policy</a> before continuing.
        </p>
      </section>
    </main>
  )
}
