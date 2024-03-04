import dotenv from 'dotenv'
import { app } from './app'
import { dbConnect } from './config/db'

dotenv.config()

const dbUrl: string = process.env.DATABASE_URL || ''

const port = process.env.PORT || 5000
dbConnect(dbUrl)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
