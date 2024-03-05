import jwt, { JwtPayload } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import UserModel, { IUser } from '../models/user-model'
import ErrorHandler from '../utils/error-handler'
import {
  generateToken,
  generateVerificationCodeAndToken,
  sendToken,
} from '../utils/generate-token'
import ejs from 'ejs'
import path from 'path'
import sendVerificationCodeMail from '../config/send-mail'
import { redis } from '../config/redis'
import { accessTokenOptions, refreshTokenOptions } from '../utils/token-config'
import { getUserById } from '../services/user-service'

interface IRegistrationBody {
  name: string
  email: string
  password: string
  avatar?: string
}

export const registerUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract the body
      const { name, email, password }: IRegistrationBody = req.body
      // Fetch user
      const existingUser = await UserModel.findOne({ email })
      //   Check if user exists
      if (existingUser) {
        return next(
          new ErrorHandler('User already exists with this email address', 400),
        )
      }

      const user = await UserModel.create({ name, email, password })

      //   Generate verification code and token
      const userId = user._id
      const verificationToken = generateVerificationCodeAndToken(userId, email)
      const { verificationCode, token } = verificationToken

      //   Mail the verification code
      try {
        await sendVerificationCodeMail({
          email: user.email,
          subject: 'Verify your account',
          verificationCode,
        })
        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account`,
          verificationToken: token,
        })
      } catch (error) {
        // @ts-ignore
        return next(new ErrorHandler(error.message, 400))
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

interface IActivationRequest {
  verificationToken: string
  verificationCode: string
}
export const activateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        verificationToken,
        verificationCode,
      }: IActivationRequest = req.body
      const newUser: {
        email: string
        userId: string
        verificationCode: string
      } = jwt.verify(verificationToken, process.env.JWT_SECRET as string) as {
        email: string
        userId: string
        verificationCode: string
      }
      console.log(newUser)

      if (newUser.verificationCode !== verificationCode) {
        return next(new ErrorHandler('Invalid Activation Code', 400))
      }
      const { email } = newUser
      const user = await UserModel.findOne({ email })
      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }
      user.isVerified = true
      try {
        await user.save()
        generateToken(res, user._id)
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
        })
      } catch (error) {
        // @ts-ignore
        return next(new ErrorHandler(error.message, 400))
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

interface ILoginRequest {
  email: string
  password: string
}

export const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: ILoginRequest = req.body
      if (!email || !password) {
        return next(new ErrorHandler('Please provide email and password', 401))
      }
      const user = await UserModel.findOne({ email }).select('+password')

      if (!user) {
        return next(new ErrorHandler('Invalid Credentials', 401))
      }

      const isPasswordMatched = await user.comparePassword(password)
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Credentials', 401))
      }
      if (!user.isVerified) {
        return next(new ErrorHandler('Please verify your account', 401))
      }
      const userWP = await UserModel.findOne({ email })
      if (!userWP) {
        return next(new ErrorHandler('User not found', 404))
      }

      sendToken(userWP, 200, res)
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

export const logoutUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('jwt', '', { maxAge: 1 })
      res.cookie('access_token', '', { maxAge: 1 })
      res.cookie('refresh_token', '', { maxAge: 1 })
      const userId = req.user?._id || ''
      redis.del(userId)
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)
export const updateAccessToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string,
      ) as JwtPayload
      console.log(decoded)
      const message = 'Could not refresh token'
      if (!decoded) {
        return next(new ErrorHandler(message, 400))
      }
      const session = await redis.get(decoded.id as string)
      if (!session) {
        return next(new ErrorHandler(message, 400))
      }
      const user = JSON.parse(session)

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: '5m',
        },
      )
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: '7d',
        },
      )
      res.cookie('access_token', accessToken, accessTokenOptions)
      res.cookie('refresh_token', refreshToken, refreshTokenOptions)
      res.status(200).json({
        success: true,
        accessToken,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

interface ISocialAuthBody {
  email: string
  name: string
  avatar: string
}
// Social Auth
export const socialAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar }: ISocialAuthBody = req.body
      const user = await UserModel.findOne({ email })
      if (!user) {
        const newUser = await UserModel.create({
          email,
          name,
          avatar,
        })
        sendToken(newUser, 201, res)
      } else {
        sendToken(user, 200, res)
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

export const getUserInfo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id
      getUserById(userId, res)
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)
