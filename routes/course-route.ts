import express from 'express'

import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {
  addQuestion,
  addReview,
  getAllcourses,
  getCourseByUser,
  getSingleCourse,
  replyQuestion,
  replyToReview,
  uploadCourse,
} from '../controllers/course-controller'
import { getAdminAllCourses } from '../controllers/course-controller'

const router = express.Router()

router.post(
  '/create-course',
  isAuthenticated,
  authorizedRoles('Admin'),
  uploadCourse,
)
router.put(
  '/edit-course/:id',
  isAuthenticated,
  authorizedRoles('Admin'),
  uploadCourse,
)
router.get('/:id', getSingleCourse)
router.get('/', getAllcourses)
router.get('/get-course-content/:id', isAuthenticated, getCourseByUser)
router.put('/add-question', isAuthenticated, addQuestion)
router.put('/reply/:id', isAuthenticated, replyQuestion)
router.put('/add-review/:id', isAuthenticated, addReview)
router.put(
  '/review-reply',
  isAuthenticated,
  authorizedRoles('Admin'),
  replyToReview,
)
router.get(
  '/get-courses',
  isAuthenticated,
  authorizedRoles('Admin'),
  getAdminAllCourses,
)

export default router
