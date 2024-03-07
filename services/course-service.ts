import { Response } from 'express'
import asyncHandler from '../middleware/async-handler'
import CourseModel from '../models/course-model'
import OrderModel from '../models/order-model'

export const createCourse = asyncHandler(async (data: any, res: Response) => {
  const course = await CourseModel.create(data)
  res.status(201).json({ success: true, data: course })
})

// Get All Courses
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 })

  res.status(201).json({
    success: true,
    courses,
  })
}
