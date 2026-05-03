import crypto from 'crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY!;
const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID!;
const VARIANT_ID = process.env.LEMON_SQUEEZY_VARIANT_ID!;
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;
const SUBSCRIPTION_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

function lsHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  };
}

export interface CreateCheckoutOptions {
  userId: string;
  productIds: string[];
  totalInCents: number;
  checkoutName: string; // shown as product name on the LS checkout page
  productDescription?: string;
  thumbnailUrl?: string;
}

export async function createCheckout(opts: CreateCheckoutOptions): Promise<string> {
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        custom_price: opts.totalInCents,
        checkout_data: {
          custom: {
            user_id: opts.userId,
            products_ids: opts.productIds.join(','),
          },
        },
        product_options: {
          name: opts.checkoutName,
          ...(opts.productDescription ? { description: opts.productDescription } : {}),
          ...(opts.thumbnailUrl ? { media: [opts.thumbnailUrl] } : {}),
          receipt_button_text: 'View your orders',
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: STORE_ID } },
        variant: { data: { type: 'variants', id: VARIANT_ID } },
      },
    },
  };

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy checkout creation failed: ${err}`);
  }

  const json = (await res.json()) as { data: { attributes: { url: string } } };
  return json.data.attributes.url;
}

// ─── Subscription checkout ────────────────────────────────────────────────────

export interface CreateSubscriptionCheckoutOptions {
  userId: string;
  lsVariantId: string;
  planName: string;
  planDescription?: string;
}

export async function createSubscriptionCheckout(
  opts: CreateSubscriptionCheckoutOptions,
): Promise<string> {
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: {
            user_id: opts.userId,
          },
        },
        product_options: {
          name: opts.planName,
          ...(opts.planDescription ? { description: opts.planDescription } : {}),
          receipt_button_text: 'Start downloading',
          confirmation_title: "You're all set!",
          confirmation_message:
            'Your subscription is active. You can now start downloading 3D jewelry models. Check your inbox for a receipt.',
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: STORE_ID } },
        variant: { data: { type: 'variants', id: opts.lsVariantId } },
      },
    },
  };

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy subscription checkout creation failed: ${err}`);
  }

  const json = (await res.json()) as { data: { attributes: { url: string } } };
  return json.data.attributes.url;
}

// ─── Fetch variant from LS ────────────────────────────────────────────────────

export interface LsVariant {
  id: string;
  name: string;
  description: string | null;
  price: number; // in dollars
  interval: 'month' | 'year' | null;
  status: string;
  productId: string;
}

export async function getLsVariant(lsVariantId: string): Promise<LsVariant | null> {
  const res = await fetch(`${LS_API_BASE}/variants/${lsVariantId}`, {
    headers: lsHeaders(),
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy variant fetch failed: ${err}`);
  }

  const json = (await res.json()) as {
    data: {
      id: string;
      attributes: {
        name: string;
        description: string | null;
        price: number;
        interval: 'month' | 'year' | null;
        status: string;
        product_id: number;
      };
    };
  };

  const { attributes } = json.data;
  return {
    id: json.data.id,
    name: attributes.name,
    description: attributes.description,
    price: attributes.price / 100,
    interval: attributes.interval,
    status: attributes.status,
    productId: String(attributes.product_id),
  };
}

// ─── Cancel subscription via LS API ──────────────────────────────────────────

export async function cancelLsSubscription(lsSubscriptionId: string): Promise<void> {
  const res = await fetch(`${LS_API_BASE}/subscriptions/${lsSubscriptionId}`, {
    method: 'DELETE',
    headers: lsHeaders(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy subscription cancellation failed: ${err}`);
  }
}

function verifySignature(secret: string, rawBody: Buffer, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  return verifySignature(WEBHOOK_SECRET, rawBody, signature);
}

export function verifySubscriptionWebhookSignature(rawBody: Buffer, signature: string): boolean {
  return verifySignature(SUBSCRIPTION_WEBHOOK_SECRET, rawBody, signature);
}

// ─── Webhook payload ─────────────────────────────────────────────────────────

export type LsEventName =
  | 'order_created'
  | 'order_refunded'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | (string & {});

export interface LsWebhookPayload {
  meta: {
    event_name: LsEventName;
    custom_data: {
      user_id: string;
      products_ids?: string; // comma-separated product IDs (order events only)
    } | null;
  };
  data: {
    id: string;
    attributes: {
      // order fields
      status?: string;
      refunded?: boolean;
      total?: number;
      currency?: string;
      urls?: { receipt: string };
      // subscription fields
      variant_id?: number;
      renews_at?: string | null;
      ends_at?: string | null;
    };
  };
}
