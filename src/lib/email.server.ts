import { Resend } from 'resend'

type OtpType =
  'sign-in' | 'change-email' | 'email-verification' | 'forget-password'

const SUBJECT_MAP: Record<OtpType, string> = {
  'sign-in': 'Your HowToBuild.dev sign-in code',
  'change-email': 'Verify your new email for HowToBuild.dev',
  'email-verification': 'Verify your email for HowToBuild.dev',
  'forget-password': 'Reset your password for HowToBuild.dev',
}

const TITLE_MAP: Record<OtpType, string> = {
  'sign-in': 'Sign-in Code',
  'change-email': 'Confirm Email Change',
  'email-verification': 'Verify Your Email',
  'forget-password': 'Reset Your Password',
}

const INTRO_MAP: Record<OtpType, string> = {
  'sign-in':
    'Use this one-time code to sign in to your HowToBuild.dev account.',
  'change-email':
    'Use this one-time code to confirm the email address change on your account.',
  'email-verification': 'Use this one-time code to verify your email address.',
  'forget-password':
    'Use this one-time code to continue resetting your password.',
}

export async function sendOtpEmail(input: {
  email: string
  otp: string
  type: OtpType
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM are required to send an OTP')
  }

  const resend = new Resend(apiKey)

  const subject = SUBJECT_MAP[input.type]
  const title = TITLE_MAP[input.type]

  const { error } = await resend.emails.send({
    from,
    to: [input.email],
    subject,
    template: {
      id: 'how-to-build-generic',
      variables: {
        TITLE: title,
        PREHEADER: `${title} for HowToBuild.dev`,
        INTRO: INTRO_MAP[input.type],
        CODE_LABEL: 'One-time verification code',
        CODE: input.otp,
        FOOTER:
          'If you did not request this code, you can safely ignore this email.',
      },
    },
  })

  if (error) {
    throw new Error(`Resend rejected the OTP email: ${error.message}`)
  }
}
