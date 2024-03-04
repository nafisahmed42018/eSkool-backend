import express from 'express'
import dotenv from 'dotenv'

export const app = express()

dotenv.config()

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
