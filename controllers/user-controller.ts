import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import UserModel, { IUser } from '../models/user-model'
import ErrorHandler from '../utils/error-handler'
import { generateVerificationToken } from '../utils/generate-token'
import ejs from 'ejs'
import path from 'path'
import sendMail from '../config/send-mail'

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
      const verificationToken = generateVerificationToken(userId)
      const { verificationCode, token } = verificationToken

      //   Mail the verification code
      const data = { user: { name: user.name }, verificationCode }
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/activation-mail.ejs'),
        data,
      )

      try {
        await sendMail({
          email: user.email,
          subject: 'Verify your account',
          template: 'activation-mail.ejs',
          data,
        })
        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account`,
          verificationToken: verificationCode,
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
