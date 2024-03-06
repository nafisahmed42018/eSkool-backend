import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user-route'
import courseRouter from './routes/course-route'
import orderRouter from './routes/order-route'
import { errorHandler } from './middleware/error'

export const app = express()

// body parser
app.use(express.json({ limit: '50mb' }))
// cookie parser
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.ORIGIN,
  }),
)

// testing api
app.use('/api/v1/auth', userRouter)
app.use('/api/v1/course', courseRouter)
app.use('/api/v1/order', orderRouter)
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: 'API test route',
  })
})

// unknown route req

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any
  err.statusCode = 404
  next(err)
})

app.use(errorHandler)
