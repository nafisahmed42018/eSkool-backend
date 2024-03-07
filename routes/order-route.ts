import express from 'express'

import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import { createOrder, getAllOrders } from '../controllers/order-controller'

const router = express.Router()

router.post('/create-order', isAuthenticated, createOrder)
router.get(
  '/get-orders',
  isAuthenticated,
  authorizedRoles('Admin'),
  getAllOrders,
)

export default router
