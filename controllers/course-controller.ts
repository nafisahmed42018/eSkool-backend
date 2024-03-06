import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import UserModel, { IUser } from '../models/user-model'
import ErrorHandler from '../utils/error-handler'
import cloudinary from 'cloudinary'
import { createCourse } from '../services/course-service'
import CourseModel from '../models/course-model'
import { redis } from '../config/redis'
import mongoose from 'mongoose'
import NotificationModel from '../models/notification-model'

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

interface IAddQuestionData {
  question: string
  courseId: string
  contentId: string
}
export const addQuestion = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body
      const course = await CourseModel.findById(courseId)
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400))
      }
      const courseContent = course?.courseData?.find((content: any) =>
        content._id.equals(contentId),
      )
      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400))
      }
      const newQuestion: any = {
        user: req.user,
        comment: question,
        commentReplies: [],
      }

      courseContent.questions.push(newQuestion)
      await course?.save()
      await NotificationModel.create({
        user: req.user?.id,
        title: 'New Question Recieved',
        message: `You have a new question in ${course?.name} from ${req.user?.name}`,
      })
      res.status(200).json({
        success: true,
        data: course,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
interface IReplyQuestionData {
  questionId: string
  courseId: string
  contentId: string
  reply: string
}
export const replyQuestion = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        questionId,
        courseId,
        contentId,
        reply,
      }: IReplyQuestionData = req.body
      const course = await CourseModel.findById(courseId)
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400))
      }
      const courseContent = course?.courseData?.find((content: any) =>
        content._id.equals(contentId),
      )
      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400))
      }
      const question = courseContent.questions.find((question: any) =>
        question._id.equals(questionId),
      )
      if (!question) {
        return next(new ErrorHandler('Invalid question id', 400))
      }
      const newReply: any = {
        user: req.user,
        comment: reply,
      }
      question.commentReplies?.push(newReply)
      await course?.save()

      if (req.user?._id === question.user._id) {
        // send notification to course owner
        await NotificationModel.create({
          user: question.user?._id,
          title: 'A user responded to your question',
          message: `You have a new reply in ${course?.name} from ${req.user?.name}`,
        })
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        }
      }
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
interface IAddReview {
  review: string
  rating: number
  userId: string
}
export const addReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id
      const courseExists = userCourseList?.some((course: any) =>
        course._id.equals(courseId),
      )
      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 500),
        )
      }
      const course = await CourseModel.findById(courseId)

      const { review, rating }: IAddReview = req.body

      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      }

      course?.reviews.push(reviewData)

      //   let averageRating = 0
      const averageRating = course!.reviews.reduce(
        (acc, course) => course.rating + acc,
        0,
      )
      if (course) {
        course.ratings = averageRating / course.reviews.length
      }
      await course?.save()

      //   const notification = {
      //     title: 'New Review Recieved',
      //     message: `${req.user?.name} has given a reviewn in ${course?.name}`,
      //   }
      //   to do create notificaiton
      res.status(200).json({
        success: true,
        data: course,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
interface IAddReviewData {
  comment: string
  courseId: string
  reviewId: string
}
export const replyToReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId }: IAddReviewData = req.body
      const course = await CourseModel.findById(courseId)
      if (!course) {
        return next(new ErrorHandler('Course Not Found', 404))
      }
      const review = course.reviews.find((review: any) =>
        review._id.find(reviewId),
      )
      if (!review) {
        return next(new ErrorHandler('Review Not Found', 404))
      }
      const replyData: any = {
        user: req.user,
        comment,
      }
      if (!review.commentReplies) {
        review.commentReplies = []
      }
      review.commentReplies?.push(replyData)

      await course?.save()

      res.status(200).json({
        success: true,
        data: course,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
