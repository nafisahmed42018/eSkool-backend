import express from 'express'

import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {
  addQuestion,
  getAllcourses,
  getCourseByUser,
  getSingleCourse,
  uploadCourse,
} from '../controllers/course-controller'

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
router.get('/add-question', isAuthenticated, addQuestion)

export default router
