import express from 'express'
import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {
  getCoursesAnalytics,
  getOrderAnalytics,
  getUsersAnalytics,
} from '../controllers/analytics-controller'

const router = express.Router()

router.get(
  '/get-users-analytics',
  isAuthenticated,
  authorizedRoles('Admin'),
  getUsersAnalytics,
)

router.get(
  '/get-orders-analytics',
  isAuthenticated,
  authorizedRoles('Admin'),
  getOrderAnalytics,
)

router.get(
  '/get-courses-analytics',
  isAuthenticated,
  authorizedRoles('Admin'),
  getCoursesAnalytics,
)

export default router
