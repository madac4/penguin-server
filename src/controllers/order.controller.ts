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

  const freeProducts = products.filter((p) => p.price === 0);
  if (freeProducts.length > 0) {
    throw new ErrorHandler('Free products cannot be purchased', 400);
  }

  for (const product of products) {
    if (await orderService.hasPurchased(userId, product._id.toString())) {
      throw new ErrorHandler(`You already own "${product.name.en}"`, 400);
    }
  }

  const totalInCents = products.reduce((sum, p) => sum + Math.round(p.price * 100), 0);

  const checkoutName =
    products.length === 1
      ? products[0].name.en
      : `3D Model Bundle (${products.length} items)`;

  const thumbnailUrl = products.length === 1 ? products[0].thumbnail || undefined : undefined;
  const description = products.length === 1 ? products[0].description?.en || undefined : undefined;

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
      if (!custom_data?.user_id || !custom_data?.products_ids?.length) {
        res.status(200).json({ received: true });
        return;
      }

      await orderService.createOrder({
        userId: custom_data.user_id,
        productIds: custom_data.products_ids,
        lsOrderId: payload.data.id,
        total: payload.data.attributes.total,
        currency: payload.data.attributes.currency,
        receiptUrl: payload.data.attributes.urls.receipt,
      });
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
