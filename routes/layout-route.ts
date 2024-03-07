import express from 'express'
import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from '../controllers/layout-controller'

const router = express.Router()

router.post('/create', isAuthenticated, authorizedRoles('Admin'), createLayout)

router.put('/edit', isAuthenticated, authorizedRoles('Admin'), editLayout)

router.get('/:type', getLayoutByType)

export default router
