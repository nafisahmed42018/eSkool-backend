import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import UserModel, { IUser } from '../models/user-model'
import ErrorHandler from '../utils/error-handler'
import {
  generateToken,
  generateVerificationToken,
} from '../utils/generate-token'
import ejs from 'ejs'
import path from 'path'
import sendVerificationCodeMail from '../config/send-mail'

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
      const verificationToken = generateVerificationToken(userId, email)
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
