import jwt, { Secret } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Response } from 'express'

dotenv.config()

interface IVerificationToken {
  token: string
  verificationCode: string
}

export const generateVerificationToken = (
  userId: string,
  email: string,
): IVerificationToken => {
  const verificationCode = (100000 + Math.random() * 900000)
    .toFixed()
    .substring(0, 6)
  const token = jwt.sign(
    { userId, email, verificationCode },
    process.env.JWT_SECRET as Secret,
    { expiresIn: '5m' },
  )

  return {  token, verificationCode }
}

export const generateToken = (res: Response, userId: string) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET as Secret, {
    expiresIn: '30d',
  })

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds,
  })
}
