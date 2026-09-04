import { Resend } from 'resend'

type OtpType =
  | 'sign-in'
  | 'change-email'
  | 'email-verification'
  | 'forget-password'

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

  const subject = SUBJECT_MAP[input.type] ?? 'Your HowToBuild.dev verification code'
  const title = TITLE_MAP[input.type] ?? 'Verification Code'

  const { error } = await resend.emails.send({
    from,
    to: [input.email],
    subject,
    template: {
      id: 'how-to-build-generic',
      variables: {
        title,
        otp: input.otp,
        type: input.type,
      },
    },
  })

  if (error) {
    throw new Error(`Resend rejected the OTP email: ${error.message}`)
  }
}
