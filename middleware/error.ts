import { Request, Response, NextFunction } from 'express'
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
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`
    err = new ErrorHandler(message, 400)
  }
  //   wrong jwt error
  if (err.name === 'JsonWebTokenError') {
    const message = `Json Web Token is invalid, try again`
    err = new ErrorHandler(message, 400)
  }

  //  JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = `Json Web Token is expired, try again`
    err = new ErrorHandler(message, 400)
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  })
}
