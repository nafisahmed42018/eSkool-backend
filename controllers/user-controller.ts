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
import {
  getAllUsersService,
  getUserById,
  updateUserRoleService,
} from '../services/user-service'
import cloudinary from 'cloudinary'

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
      // console.log(newUser)

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
      // console.log(decoded)
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
      req.user = user
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
      if (user) {
        user.avatar.url = avatar
        await user?.save()
        sendToken(user, 200, res)
      } else {
        const newUser = await UserModel.create({
          email,
          name,
          avatar,
        })
        sendToken(newUser, 201, res)
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
export const updateUserInfo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body
      const userId = req.user?._id
      const user = await UserModel.findById(userId)
      // console.log()

      if (user && name) {
        user.name = name
      }

      await user?.save()

      await redis.set(userId, JSON.stringify(user))

      res.status(201).json({
        success: true,
        user: user,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body
      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler('Please provide old and new password', 400),
        )
      }
      const userId = req.user?._id
      const user = await UserModel.findById(userId).select('+password')
      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }
      const isPasswordMatch = await user.comparePassword(oldPassword)
      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid old password', 400))
      }
      if (await user.comparePassword(newPassword)) {
        return next(
          new ErrorHandler('Old and new password cannot be same', 400),
        )
      }
      user.password = newPassword
      await user.save()
      await redis.set(userId, JSON.stringify(user))
      res.status(201).json({
        success: true,
        message: 'Password changed successfully',
        user: user,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

interface IUpdateProfilePicture {
  avatar: string
}

export const updateProfilePicture = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar }: IUpdateProfilePicture = req.body
      const userId = req.user?._id
      const user = await UserModel.findById(userId)
      if (avatar && user) {
        if (user?.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id)
          const cloudUpload = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'lms/avatars',
            width: 150,
            height: 150,
          })
          user.avatar = {
            public_id: cloudUpload.public_id,
            url: cloudUpload.secure_url,
          }
        } else {
          const cloudUpload = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'lms/avatars',
            width: 150,
            height: 150,
          })
          user.avatar = {
            public_id: cloudUpload.public_id,
            url: cloudUpload.secure_url,
          }
        }
        await user.save()
        await redis.set(userId, JSON.stringify(user))
        res.status(200).json({
          success: true,
          message: 'Password changed successfully',
          user: user,
        })
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

// get all users --- only for admin
export const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res)
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

// update user role --- only for admin
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body
      const isUserExist = await UserModel.findOne({ email })
      if (isUserExist) {
        const id = isUserExist._id
        updateUserRoleService(res, id, role)
      } else {
        res.status(400).json({
          success: false,
          message: 'User not found',
        })
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)

// Delete user --- only for admin
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      const user = await UserModel.findById(id)

      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }

      await user.deleteOne({ id })

      await redis.del(id)

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 400))
    }
  },
)
