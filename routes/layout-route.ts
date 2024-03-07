import express from 'express'
import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import { createLayout } from '../controllers/layout-controller'

const router = express.Router()

router.post(
  '/create-layout',
  isAuthenticated,
  authorizedRoles('Admin'),
  createLayout,
)



export default router
