import { Response } from 'express'
import asyncHandler from '../middleware/async-handler'
import CourseModel from '../models/course-model'

export const createCourse = asyncHandler(async (data: any, res: Response) => {
  const course = await CourseModel.create(data)
  res.status(201).json({ success: true, data: course })
})
