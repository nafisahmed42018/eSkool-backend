import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import UserModel, { IUser } from '../models/user-model'
import ErrorHandler from '../utils/error-handler'
import cloudinary from 'cloudinary'
import { createCourse } from '../services/course-service'
import CourseModel from '../models/course-model'
import { redis } from '../config/redis'
import mongoose from 'mongoose'