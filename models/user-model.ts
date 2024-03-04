import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import { NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const emailRegexPattern: RegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export interface IUser extends Document {
  name: string
  email: string
  password: string
  avatar: {
    public_id: string
    url: string
  }
  role: string
  isVerified: boolean
  courses: Array<{ courseId: string }>
  comparePassword: (password: string) => Promise<boolean>
  signAccessToken: () => string
  signRefreshToken: () => string
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      validate: {
        validator: (value: string) => emailRegexPattern.test(value),
        message: 'Please enter a valid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    avatar: { public_id: String, url: String },
    role: { type: String, default: 'User' },
    isVerified: { type: Boolean, default: false },
    courses: [{ courseId: String }],
  },
  { timestamps: true },
)

// Hash password before saving to database. This is a pre-save hook. It is called before the document is saved. It is used to hash the password before saving it to the database. The hash is generated using the bcrypt library. The salt is generated using the bcrypt library. The salt is 10. The password is hashed using the
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

//
userSchema.methods.signAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
    // expiresIn: process.env.JWT_EXPIRY,
  })
}
//
userSchema.methods.signRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
    // expiresIn: process.env.JWT_EXPIRY,
  })
}

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return await bcrypt.compare(password, this.password)
}

const UserModel: Model<IUser> = mongoose.model('User', userSchema)

export default UserModel
