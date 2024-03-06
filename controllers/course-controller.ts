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
export const getSingleCourse = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id
      const cacheExist = await redis.get(courseId)
      if (cacheExist) {
        const course = JSON.parse(cacheExist)
        res.status(200).json({
          success: true,
          data: course,
        })
      } else {
        const course = await CourseModel.findById(courseId).select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
        )
        await redis.set(courseId, JSON.stringify(course))
        res.status(200).json({
          success: true,
          data: course,
        })
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
export const getAllcourses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheExist = await redis.get('courses')
      if (cacheExist) {
        const courses = JSON.parse(cacheExist)
        res.status(200).json({
          success: true,
          data: courses,
        })
      } else {
        const courses = await CourseModel.find().select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
        )
        redis.set('courses', JSON.stringify(courses))
        res.status(200).json({
          success: true,
          data: courses,
        })
      }
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
export const getCourseByUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id
      const courseExist = userCourseList?.find(
        (course: any) => course._id.toString() === courseId,
      )
      if (!courseExist) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 500),
        )
      }
      const course = await CourseModel.findById(courseId)
      const content = course?.courseData
      res.status(200).json({
        success: true,
        data: content,
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
