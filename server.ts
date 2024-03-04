import { app } from './app'
import { dbConnect } from './config/db'

import dotenv from 'dotenv'
dotenv.config()

const port = process.env.PORT || 5000
dbConnect()
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
