type OtpType =
  'sign-in' | 'change-email' | 'email-verification' | 'forget-password'

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

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: 'Your HowToBuild.dev sign-in code',
      text: `Your one-time code is ${input.otp}. It expires in 10 minutes. Request type: ${input.type}.`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend rejected the OTP email (${response.status})`)
  }
}
