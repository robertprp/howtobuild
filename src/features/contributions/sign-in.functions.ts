import { createServerFn } from '@tanstack/react-start'

export const getSignInOptions = createServerFn({ method: 'GET' }).handler(
  () => ({
    github: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
    ),
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  }),
)
