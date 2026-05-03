import { toProductDto, type ProductDto } from '@/dtos/product.dto';
import type { PaginatedDto } from '@/dtos/common.dto';
import { paginatedResult } from '@/utils/pagination.util';
import type { IOrder } from '../models/order.model';
import type { IProductDocument } from '../models/product.model';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';

type LeanOrder = IOrder & { _id: { toString(): string } };

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
  userId: string;
  products: ProductDto[];
  lsOrderId: string;
  total: number;
  currency: string;
  receiptUrl: string;
  status: string;
  createdAt: string;
}

// ─── Admin: list all orders (paginated) ──────────────────────────────────────

export interface ListAllOrdersQuery {
  page?: number;
  limit?: number;
  status?: 'paid' | 'refunded';
  userId?: string;
}

async function buildOrderDtos(orders: LeanOrder[]): Promise<OrderDto[]> {
  if (orders.length === 0) return [];

  const allProductIds = [...new Set(orders.flatMap((o) => o.productIds.map((id) => id.toString())))];
  const products = await Product.find({ _id: { $in: allProductIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  return orders.map((o) => ({
    id: o._id.toString(),
    userId: o.userId.toString(),
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

export async function listAllOrders(
  query: ListAllOrdersQuery,
): Promise<PaginatedDto<OrderDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.userId) filter.userId = query.userId;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  const items = await buildOrderDtos(orders);
  return paginatedResult(items, total, page, limit);
}

export async function getOrderById(id: string): Promise<OrderDto | null> {
  const order = await Order.findById(id).lean();
  if (!order) return null;
  const [dto] = await buildOrderDtos([order]);
  return dto ?? null;
}

// ─── User: list own orders ────────────────────────────────────────────────────

export async function listOrders(userId: string): Promise<OrderDto[]> {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return buildOrderDtos(orders);
}
