import mongoose from 'mongoose'

export const dbConnect = async (dbURL: string) => {
  try {
    await mongoose.connect(dbURL).then((data: any) => {
      console.log(`Database connected with ${data.connection.host}`)
    })
  } catch (error) {
    console.log(error.message)
    setTimeout(dbConnect, 5000)
  }
}
