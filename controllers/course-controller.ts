import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import UserModel, { IUser } from '../models/user-model'
import ErrorHandler from '../utils/error-handler'
import cloudinary from 'cloudinary'
import { createCourse } from '../services/course-service'
import CourseModel from '../models/course-model'
import { redis } from '../config/redis'
import mongoose from 'mongoose'

export const uploadCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail
      if (thumbnail) {
        const cloudUpload = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'lms/courses',
        })
        data.thumbnail = {
          public_id: cloudUpload.public_id,
          url: cloudUpload.secure_url,
        }
      }
      createCourse(data, res, next)
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
export const editCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id)
        const cloudUpload = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'lms/courses',
        })
        data.thumbnail = {
          public_id: cloudUpload.public_id,
          url: cloudUpload.secure_url,
        }
      }
      const courseId = req.params.id
      const course = await UserModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        {
          new: true,
        },
      )
      res.status(201).json({
        success: true,
        data: courseId,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)

export const controller = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        data: '',
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
