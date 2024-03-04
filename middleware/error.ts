import { NextFunction } from 'express'
import ErrorHandler from '../utils/error-handler'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  //   mongodb id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ${err.path}`
    err = new ErrorHandler(message, 400)
  }
  //   Duplicate key error
  if (err.code === 11000) {
    const message = `Resource not found. Invalid ${err.path}`
    err = new ErrorHandler(message, 400)
  }
  //   mongodb id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ${err.path}`
    err = new ErrorHandler(message, 400)
  }
}
