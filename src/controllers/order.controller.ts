import type { Request, Response } from 'express';
import { CatchAsyncErrors, ErrorHandler } from '../middlewares/error.middleware';
import { Product } from '../models/product.model';
import * as lsService from '../services/lemonsqueezy.service';
import * as orderService from '../services/order.service';
import { success } from '../utils/response.util';

// ─── POST /orders/checkout ────────────────────────────────────────────────────

export const checkout = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { productIds } = req.body as { productIds: string[] };
  const userId = req.user!._id.toString();

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new ErrorHandler('productIds must be a non-empty array', 400);
  }

  const products = await Product.find({ _id: { $in: productIds } }).lean();

  if (products.length !== productIds.length) {
    throw new ErrorHandler('One or more products not found', 404);
  }

  const totalInCents = 0;

  const isSingle = products.length === 1;

  const checkoutName = isSingle
    ? products[0].name.en
    : `3D Model Bundle (${products.length} items)`;

  const description = isSingle
    ? products[0].description?.en || undefined
    : products.map((p) => `• ${p.name.en}`).join('\n');

  const thumbnailUrl = isSingle ? products[0].thumbnail || undefined : undefined;

  const checkoutUrl = await lsService.createCheckout({
    userId,
    productIds: products.map((p) => p._id.toString()),
    totalInCents,
    checkoutName,
    productDescription: description,
    thumbnailUrl,
  });

  success(res, { checkoutUrl });
});

// ─── POST /orders/webhook ─────────────────────────────────────────────────────

export const webhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-signature'] as string | undefined;

  if (!signature || !req.rawBody) {
    res.status(400).json({ error: 'Missing signature or body' });
    return;
  }

  if (!lsService.verifyWebhookSignature(req.rawBody, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = req.body as lsService.LsWebhookPayload;
  const { event_name, custom_data } = payload.meta;

  try {
    if (event_name === 'order_created' && payload.data.attributes.status === 'paid') {
      if (custom_data?.user_id && custom_data?.products_ids?.length) {
        await orderService.createOrder({
          userId: custom_data.user_id,
          productIds: custom_data.products_ids.split(',').filter(Boolean),
          lsOrderId: payload.data.id,
          total: payload.data.attributes.total!,
          currency: payload.data.attributes.currency!,
          receiptUrl: payload.data.attributes.urls!.receipt,
        });
      }
    }

    if (event_name === 'order_refunded') {
      await orderService.refundOrder(payload.data.id);
    }
  } catch {
    // Return 200 so LS doesn't retry on business-logic errors
  }

  res.status(200).json({ received: true });
};

// ─── GET /orders/me ───────────────────────────────────────────────────────────

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const orders = await orderService.listOrders(req.user!._id.toString());
  success(res, orders);
});

// ─── Admin: GET /orders ───────────────────────────────────────────────────────

export const adminList = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status, userId } = req.query as {
    page?: string;
    limit?: string;
    status?: 'paid' | 'refunded';
    userId?: string;
  };

  const result = await orderService.listAllOrders({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status,
    userId,
  });

  success(res, result);
});

// ─── Admin: GET /orders/:id ───────────────────────────────────────────────────

export const adminGetById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderById(req.params.id);
  if (!order) throw new ErrorHandler('Order not found', 404);
  success(res, order);
});
