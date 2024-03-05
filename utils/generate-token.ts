import jwt, { Secret } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Response } from 'express'
import { IUser } from '../models/user-model'
import { redis } from '../config/redis'
import { accessTokenOptions, refreshTokenOptions } from './token-config'

dotenv.config()

interface IVerificationToken {
  token: string
  verificationCode: string
}

export const generateVerificationCodeAndToken = (
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

  return { token, verificationCode }
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

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.signAccessToken()
  const refreshToken = user.signRefreshToken()

  // upload session to redis
  redis.set(user._id, JSON.stringify(user) as any)

  res.cookie('access_token', accessToken, accessTokenOptions)
  res.cookie('refresh_token', refreshToken, refreshTokenOptions)
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  })
}
