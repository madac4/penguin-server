import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose'
import { CartStatus } from '../utils/enums'

// ─── Cart Item (embedded subdocument) ────────────────────────────────────────

export interface ICartItem {
  productId: Types.ObjectId;
  addedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

// ─── Cart (one active cart per user) ─────────────────────────────────────────

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
  status: CartStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartDocument extends ICart, Document {}

const cartSchema = new Schema<ICartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [cartItemSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(CartStatus),
      default: CartStatus.Active,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
)

// TTL index: MongoDB auto-deletes expired carts
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
cartSchema.index({ userId: 1, status: 1 })
cartSchema.index({ 'items.productId': 1 })

export const Cart: Model<ICartDocument> =
  mongoose.models.Cart ?? model<ICartDocument>('Cart', cartSchema)
