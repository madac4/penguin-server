import { type Document, type Model } from 'mongoose';
import { Role } from '../utils/enums';
export interface IUser {
    role: Role;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    isEmailConfirmed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserDocument extends IUser, Document {
}
export declare const User: Model<IUserDocument>;
//# sourceMappingURL=user.model.d.ts.map