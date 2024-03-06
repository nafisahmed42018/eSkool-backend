import express from 'express'

import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {
  getNotifications,
  updateNotificationStatus,
} from '../controllers/notification-controller'

const router = express.Router()

router.post('/all', isAuthenticated, authorizedRoles('Admin'), getNotifications)
router.put(
  '/update-status/:id',
  isAuthenticated,
  authorizedRoles('Admin'),
  updateNotificationStatus,
)

export default router
