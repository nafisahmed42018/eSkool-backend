import mongoose, { Schema, Model, Document } from 'mongoose'

export interface IFaqItem extends Document {
  question: string
  answer: string
}

export interface ICategory extends Document {
  title: string
}

export interface IBannerImage extends Document {
  public_id: string
  url: string
}

interface ILayout extends Document {
  type: string
  faq?: IFaqItem[]
  categories?: ICategory[]
  banner?: {
    image: IBannerImage
    title: string
    subTitle: string
  }
}

const faqSchema = new Schema<IFaqItem>({
  question: { type: String },
  answer: { type: String },
})

const categorySchema = new Schema<ICategory>({
  title: { type: String },
})

const bannerImageSchema = new Schema<IBannerImage>({
  public_id: { type: String },
  url: { type: String },
})

const layoutSchema = new Schema<ILayout>({
  type: { type: String },
  faq: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: bannerImageSchema,
    title: { type: String },
    subTitle: { type: String },
  },
})

const LayoutModel: Model<ILayout> = mongoose.model('Layout', layoutSchema)

export default LayoutModel
