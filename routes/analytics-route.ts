import express from 'express'
import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {
  getCoursesAnalytics,
  getOrderAnalytics,
  getUsersAnalytics,
} from '../controllers/analytics-controller'

const router = express.Router()

router.get(
  '/get-users',
  isAuthenticated,
  authorizedRoles('Admin'),
  getUsersAnalytics,
)

router.get(
  '/get-orders',
  isAuthenticated,
  authorizedRoles('Admin'),
  getOrderAnalytics,
)

router.get(
  '/get-courses',
  isAuthenticated,
  authorizedRoles('Admin'),
  getCoursesAnalytics,
)

export default router
