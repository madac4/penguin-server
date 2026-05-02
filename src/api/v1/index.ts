import { Router, type Request, type Response } from 'express';
import authRouter from './routes/auth.routes';
import categoryRouter from './routes/category.routes';
import healthRouter from './routes/health.routes';
import mediaRouter from './routes/media.routes';
import planRouter from './routes/plan.routes';
import productRouter from './routes/product.routes';
import profileRouter from './routes/profile.routes';
import propertyDefinitionRouter from './routes/property-definition.routes';
import subscriptionRouter from './routes/subscription.routes';
import tagRouter from './routes/tag.routes';
import userRouter from './routes/user.routes';
import wishlistRouter from './routes/wishlist.routes';

const v1Router = Router();

v1Router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Penguin CMS API v1',
    docs: '/docs',
  });
});

v1Router.use('/property-definitions', propertyDefinitionRouter);
v1Router.use('/categories', categoryRouter);
v1Router.use('/wishlist', wishlistRouter);
v1Router.use('/products', productRouter);
v1Router.use('/profile', profileRouter);
v1Router.use('/health', healthRouter);
v1Router.use('/media', mediaRouter);
v1Router.use('/users', userRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/tags', tagRouter);
v1Router.use('/plans', planRouter);
v1Router.use('/subscriptions', subscriptionRouter);

export default v1Router;
