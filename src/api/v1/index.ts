import { Router, type Request, type Response } from 'express';
import authRouter from './routes/auth.routes';
import healthRouter from './routes/health.routes';

const v1Router = Router();

v1Router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Penguin CMS API v1',
    docs: '/docs',
  });
});

v1Router.use('/auth', authRouter);
v1Router.use('/health', healthRouter);

export default v1Router;
