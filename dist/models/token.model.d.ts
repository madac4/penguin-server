import { type Document, type Model, type Types } from 'mongoose';
import { TokenType } from '../utils/enums';
export interface IToken {
    userId: Types.ObjectId;
    type: TokenType;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface ITokenDocument extends IToken, Document {
}
export declare const Token: Model<ITokenDocument>;
//# sourceMappingURL=token.model.d.ts.map