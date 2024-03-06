import express from 'express'
import {
  activateUser,
  changePassword,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  socialAuth,
  updateAccessToken,
  updateProfilePicture,
  updateUserInfo,
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
router.put('/update-user', isAuthenticated, updateUserInfo)
router.put('/update-password', isAuthenticated, changePassword)
router.put('/update-user-avatar', isAuthenticated, updateProfilePicture)

export default router
