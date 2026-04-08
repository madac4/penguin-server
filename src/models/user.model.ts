import mongoose, { Schema, model, type Document, type Model } from 'mongoose'
import { Role } from '../utils/enums'

export interface IUser {
  role: Role;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isEmailConfirmed: boolean;
  isBlocked: boolean;
  pendingEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.User,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    isEmailConfirmed: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    pendingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        const { password: _p, ...rest } = ret;
        return rest;
      },
    },
  },
);

export const User: Model<IUserDocument> =
  mongoose.models.User ?? model<IUserDocument>('User', userSchema);
