import { Request, Response, NextFunction } from 'express'
import { generateLast12MonthData } from '../utils/analytics-generator'
import asyncHandler from '../middleware/async-handler'
import ErrorHandler from '../utils/error-handler'
import UserModel from '../models/user-model'
import CourseModel from '../models/course-model'
import OrderModel from '../models/order-model'

// get users analytics --- only for admin
export const getUsersAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthData(UserModel)

      res.status(200).json({
        success: true,
        users,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)

// get courses analytics --- only for admin
export const getCoursesAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthData(CourseModel)

      res.status(200).json({
        success: true,
        courses,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)

// get order analytics --- only for admin
export const getOrderAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthData(OrderModel)

      res.status(200).json({
        success: true,
        orders,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
