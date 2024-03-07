import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import ErrorHandler from '../utils/error-handler'
import OrderModel, { IOrder } from '../models/order-model'
import UserModel from '../models/user-model'
import CourseModel from '../models/course-model'
import { getAllOrdersService, newOrder } from '../services/order-service'
import NotificationModel from '../models/notification-model'

export const createOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info }: IOrder = req.body
      const user = await UserModel.findById(req.user?._id)
      const alreadyPurchased = user?.courses.some((course: any) =>
        course._id.equals(courseId),
      )
      if (alreadyPurchased) {
        return next(
          new ErrorHandler('You have already purchased this course', 400),
        )
      }

      const course = await CourseModel.findById(courseId)
      if (!course) {
        return next(new ErrorHandler('Course not found', 404))
      }
      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      }
      /*
      const mailData = {
        order: {
          _id: course._id,
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString('en-UK', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
      }
      try {
      } catch (error) {}*/

      user?.courses.push(course?._id)
      await user?.save()
      // send notification of purchase to course owner
      await NotificationModel.create({
        user: user?._id,
        title: 'New Order',
        message: `You have a new order from ${course?.name}`,
      })

      newOrder(data, res, next)
      course.purchased ? (course.purchased += 1) : course.purchased

      await course?.save()
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)

// get All orders --- only for admin
export const getAllOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res)
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
