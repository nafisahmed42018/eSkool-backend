import express from 'express'

import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {

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


export default router
