import express from 'express'
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  socialAuth,
  updateAccessToken,
} from '../controllers/user-controller'
import { authorizedRoles, isAuthenticated } from '../middleware/auth-handler'

const router = express.Router()

router.post('/registration', registerUser)
router.post('/activate-user', activateUser)
router.post('/login', loginUser)
router.get(
  '/logout',
  isAuthenticated,
  //   authorizedRoles('Admin', 'Seller'),
  logoutUser,
)
router.get('/refresh-token', updateAccessToken)
router.get('/me', isAuthenticated, getUserInfo)
router.post('/social-auth', socialAuth)

export default router
