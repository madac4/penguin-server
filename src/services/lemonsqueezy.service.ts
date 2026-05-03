import crypto from 'crypto';

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY!;
const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID!;
const VARIANT_ID = process.env.LEMON_SQUEEZY_VARIANT_ID!;
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

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
  checkoutName: string;       // shown as product name on the LS checkout page
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
            products_ids: opts.productIds,
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

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ─── Webhook payload ─────────────────────────────────────────────────────────

export interface LsWebhookPayload {
  meta: {
    event_name: 'order_created' | 'order_refunded' | string;
    custom_data: {
      user_id: string;
      products_ids: string[];
    } | null;
  };
  data: {
    id: string;
    attributes: {
      status: string;
      refunded: boolean;
      total: number;
      currency: string;
      urls: {
        receipt: string;
      };
    };
  };
}
