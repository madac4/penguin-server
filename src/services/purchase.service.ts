import { Purchase } from '../models/purchase.model';

export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  return !!(await Purchase.exists({ userId, productId }));
}

export async function recordPurchase(userId: string, productId: string): Promise<void> {
  await Purchase.updateOne({ userId, productId }, {}, { upsert: true });
}
