import { Resend } from 'resend'

interface EmailOptions {
  email: string
  subject: string
  verificationCode: string
}
const resend = new Resend(process.env.RESEND_API_KEY)

const sendVerificationCodeMail = async (
  options: EmailOptions,
): Promise<void> => {
  const { email, subject, verificationCode } = options
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: subject,
    html: `<p>Verification Code ${verificationCode}</p>`,
  })
}

export default sendVerificationCodeMail
