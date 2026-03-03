import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { TokenType } from '../utils/enums';

export interface IToken {
  userId: Types.ObjectId;
  type: TokenType;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ITokenDocument extends IToken, Document {}

const tokenSchema = new Schema<ITokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TokenType),
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ userId: 1, type: 1 });

export const Token: Model<ITokenDocument> =
  mongoose.models.Token ?? model<ITokenDocument>('Token', tokenSchema);
