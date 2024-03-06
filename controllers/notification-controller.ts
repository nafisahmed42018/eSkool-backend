import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../middleware/async-handler'
import ErrorHandler from '../utils/error-handler'
import { redis } from '../config/redis'
import mongoose from 'mongoose'
import NotificationModel from '../models/notification-model'

export const getNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      })
      res.status(200).json({
        success: true,
        data: notifications,
      })
    } catch (error) {
      // @ts-ignore
      return next(new ErrorHandler(error.message, 500))
    }
  },
)
export const updateNotificationStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id)
      if (!notification) {
        return next(new ErrorHandler('Notification not found', 404))
      } else {
        notification.status
          ? (notification.status = 'read')
          : notification.status
      }
      await notification.save()
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      })
      res.status(200).json({
        success: true,
        data: notifications,
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
