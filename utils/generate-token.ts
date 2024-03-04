import jwt, { Secret } from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

interface IVerificationToken {
  token: string
  verificationCode: string
}

export const generateVerificationToken = (
  userId: string,
): IVerificationToken => {
  const verificationCode = (100000 + Math.random() * 900000)
    .toFixed()
    .substring(0, 6)
  const token = jwt.sign(
    { userId, verificationCode },
    process.env.JWT_SECRET as Secret,
    { expiresIn: '5m' },
  )

  return { token, verificationCode }
}
