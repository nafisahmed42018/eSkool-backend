import dotenv from 'dotenv'
dotenv.config()
interface ITokenOptions {
  expires: Date
  maxAge: number
  httpOnly: boolean
  sameSite: 'strict' | 'lax' | 'none' | undefined
  secure?: boolean
}
// parse env variables to integrate with fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || '300',
  10,
)
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || '1200',
  10,
)

// cookie options
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
}
export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 3600 * 1000),
  maxAge: refreshTokenExpire * 24 * 3600 * 1000,
  httpOnly: true,
  sameSite: 'lax',
}
if (process.env.NODE_ENV === 'production') {
  accessTokenOptions.secure = true
}
