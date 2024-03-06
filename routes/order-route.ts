import express from 'express'

import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'
import { createOrder } from '../controllers/order-controller'

const router = express.Router()

router.post('/create-order', isAuthenticated, createOrder)

export default router
