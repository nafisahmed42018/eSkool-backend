import { NextFunction, Response } from 'express'
import asyncHandler from '../middleware/async-handler'
import OrderModel from '../models/order-model'

export const newOrder = asyncHandler(async (data: any, res: Response) => {
  const order = await OrderModel.create(data)
  res.status(201).json({
    success: true,
    order,
  })
})
