import type { IUserDocument } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
