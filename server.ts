import { app } from './app'
import { dbConnect } from './config/db'
import cloudinary from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config()
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
const port = process.env.PORT || 5000
dbConnect()
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
