import mongoose from 'mongoose';
import { databaseConfig } from '../config/database.config';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(databaseConfig.uri, databaseConfig.options);
    console.log('   └─ MongoDB  →  connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
}
