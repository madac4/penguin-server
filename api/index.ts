import type { Request, Response } from 'express';
import mongoose from 'mongoose';

import app from '../dist/app';
import { connectDatabase } from '../dist/database/connection';

let connectionPromise: Promise<void> | null = null;

async function ensureDatabaseConnection(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  connectionPromise ??= connectDatabase().catch((error) => {
    connectionPromise = null;
    throw error;
  });

  await connectionPromise;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    await ensureDatabaseConnection();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
    });
    return;
  }

  app(req, res);
}
