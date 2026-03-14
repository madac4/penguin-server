import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose'

// ─── Wishlist Product (embedded subdocument) ─────────────────────────────────

export interface IWishlistProduct {
  productId: Types.ObjectId;
  addedAt: Date;
}

const wishlistProductSchema = new Schema<IWishlistProduct>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ─── Wishlist (one per user) ─────────────────────────────────────────────────

export interface IWishlist {
  userId: Types.ObjectId;
  products: IWishlistProduct[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistDocument extends IWishlist, Document {}

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: { type: [wishlistProductSchema], default: [] },
  },
  { timestamps: true },
);

wishlistSchema.index({ 'products.productId': 1 });

export const Wishlist: Model<IWishlistDocument> =
  mongoose.models.Wishlist ?? model<IWishlistDocument>('Wishlist', wishlistSchema);
