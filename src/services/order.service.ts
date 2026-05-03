import { toProductDto, type ProductDto } from '@/dtos/product.dto';
import type { IProductDocument } from '../models/product.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';

// ─── Purchase check (used by product file access) ────────────────────────────

export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  return !!(await Order.exists({ userId, productIds: productId, status: 'paid' }));
}

// ─── Create order from webhook payload ───────────────────────────────────────

export interface CreateOrderInput {
  userId: string;
  productIds: string[];
  lsOrderId: string;
  total: number;
  currency: string;
  receiptUrl: string;
}

export async function createOrder(input: CreateOrderInput): Promise<void> {
  await Order.updateOne(
    { lsOrderId: input.lsOrderId },
    { $setOnInsert: { ...input } },
    { upsert: true },
  );
}

export async function refundOrder(lsOrderId: string): Promise<void> {
  await Order.updateOne({ lsOrderId }, { status: 'refunded' });
}

// ─── List orders ─────────────────────────────────────────────────────────────

export interface OrderProductDto {
  id: string;
  product: ProductDto;
}

export interface OrderDto {
  id: string;
  products: ProductDto[];
  lsOrderId: string;
  total: number;
  currency: string;
  receiptUrl: string;
  status: string;
  createdAt: string;
}

export async function listOrders(userId: string): Promise<OrderDto[]> {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  if (orders.length === 0) return [];

  const allProductIds = [...new Set(orders.flatMap((o) => o.productIds.map((id) => id.toString())))];
  const products = await Product.find({ _id: { $in: allProductIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  return orders.map((o) => ({
    id: o._id.toString(),
    products: o.productIds
      .map((id) => {
        const p = productMap.get(id.toString());
        return p ? toProductDto(p as unknown as IProductDocument) : null;
      })
      .filter((p): p is ProductDto => p !== null),
    lsOrderId: o.lsOrderId,
    total: o.total,
    currency: o.currency,
    receiptUrl: o.receiptUrl,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));
}
