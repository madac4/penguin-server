import { Router, type Request, type Response } from 'express'
import authRouter from './routes/auth.routes'
import categoryRouter from './routes/category.routes'
import healthRouter from './routes/health.routes'
import profileRouter from './routes/profile.routes'
import uploadRouter from './routes/upload.routes'
import userRouter from './routes/user.routes'

const v1Router = Router();

v1Router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Penguin CMS API v1',
    docs: '/docs',
  });
});

v1Router.use('/auth', authRouter);
v1Router.use('/categories', categoryRouter);
v1Router.use('/uploads', uploadRouter);
v1Router.use('/profile', profileRouter);
v1Router.use('/users', userRouter);
v1Router.use('/health', healthRouter);

export default v1Router;

