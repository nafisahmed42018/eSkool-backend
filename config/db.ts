import mongoose from 'mongoose'

export const dbConnect = async () => {
  try {
    await mongoose
      .connect(process.env.DATABASE_URL as string)
      .then((data: any) => {
        console.log(`Database connected with ${data.connection.host}`)
      })
  } catch (error) {
    // @ts-ignore
    console.log(error.message)
    setTimeout(dbConnect, 5000)
  }
}
