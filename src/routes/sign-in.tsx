import { useSignInSocial } from '@better-auth-ui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: [
      { title: 'Editor sign in — HowToBuild.dev' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: SignInPage,
})

function SignInPage() {
  const social = useSignInSocial(authClient)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState(
    'Use the email address on your editor invitation.',
  )
  const [busy, setBusy] = useState(false)

  async function sendOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
    })
    setBusy(false)
    if (result.error)
      setMessage(result.error.message ?? 'The code could not be sent.')
    else {
      setSent(true)
      setMessage('Check your inbox for the six-digit code.')
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = await authClient.signIn.emailOtp({ email, otp })
    setBusy(false)
    if (result.error)
      setMessage(result.error.message ?? 'That code was not accepted.')
    else window.location.assign('/admin')
  }

  return (
    <main className="auth-page shell">
      <section>
        <p className="eyebrow">Private editorial workspace</p>
        <h1>Sign in to edit.</h1>
        <p className="lede">
          Publishing access is invite-only. Identity is verified by Better Auth;
          every privileged change is attributed in the audit trail.
        </p>
      </section>
      <section className="auth-panel" aria-label="Editor sign in">
        <button
          className="button wide"
          onClick={() =>
            social.mutate({ provider: 'github', callbackURL: '/admin' })
          }
          disabled={social.isPending}
        >
          Continue with GitHub
        </button>
        <button
          className="button secondary wide"
          onClick={() =>
            social.mutate({ provider: 'google', callbackURL: '/admin' })
          }
          disabled={social.isPending}
        >
          Continue with Google
        </button>
        <span className="auth-divider">or use an invited email</span>
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
                required
              />
            </label>
          ) : null}
          <button className="button wide" type="submit" disabled={busy}>
            {busy
              ? 'Working…'
              : sent
                ? 'Verify and continue'
                : 'Email me a code'}
          </button>
        </form>
        <p className="form-message" aria-live="polite">
          {message}
        </p>
      </section>
    </main>
  )
}
