import { Response } from 'express'
import UserModel from '../models/user-model'

export const getUserById = async (id: string, res: Response) => {
  const user = await UserModel.findById(id)
  res.status(201).json({ success: true, user })
}
// Get All users
export const getAllUsersService = async (res: Response) => {
  const users = await UserModel.find().sort({ createdAt: -1 })

  res.status(201).json({
    success: true,
    users,
  })
}

// update user role
export const updateUserRoleService = async (
  res: Response,
  id: string,
  role: string,
) => {
  const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true })

  res.status(201).json({
    success: true,
    user,
  })
}
