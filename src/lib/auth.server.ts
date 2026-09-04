import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { and, eq, gt } from 'drizzle-orm'

import { getDb } from '../db/client.server'
import * as schema from '../db/schema'
import { sendOtpEmail } from './email.server'

const socialProviders = {
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
}

export const auth = betterAuth({
  appName: 'HowToBuild.dev',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret:
    process.env.BETTER_AUTH_SECRET ??
    'phase-zero-local-only-secret-never-use-in-production',
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
  }),
  socialProviders,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const invite = await getDb().query.editorInvites.findFirst({
            where: and(
              eq(schema.editorInvites.email, newUser.email.toLowerCase()),
              gt(schema.editorInvites.expiresAt, new Date()),
            ),
          })
          if (!invite || invite.acceptedAt) {
            throw new APIError('FORBIDDEN', {
              message: 'This editorial workspace is invite-only.',
            })
          }
          return { data: { ...newUser, email: newUser.email.toLowerCase() } }
        },
      },
    },
  },
  plugins: [
    emailOTP({
      expiresIn: 600,
      allowedAttempts: 5,
      storeOTP: 'hashed',
      async sendVerificationOTP(payload) {
        await sendOtpEmail(payload)
      },
    }),
    tanstackStartCookies(),
  ],
})
