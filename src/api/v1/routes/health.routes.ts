import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'OK',
    data: {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
      uptime: Math.round(process.uptime() * 100) / 100,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
