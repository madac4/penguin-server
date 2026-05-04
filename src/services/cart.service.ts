import { toCartDto, type CartDto } from '@/dtos/cart.dto'
import { ErrorHandler } from '../middlewares/error.middleware'
import { Cart } from '../models/cart.model'
import { Product } from '../models/product.model'
import { CartStatus } from '../utils/enums'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOrCreate(userId: string) {
  let cart = await Cart.findOne({ userId, status: CartStatus.Active })

  if (!cart) {
    cart = await Cart.create({ userId, items: [] })
  }

  return cart
}

// ─── Get Cart ────────────────────────────────────────────────────────────────

export async function getCart(userId: string): Promise<CartDto> {
  const cart = await getOrCreate(userId)

  const productIds = cart.items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds } }).lean()
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  return toCartDto(cart, productMap as any)
}

// ─── Add Item ────────────────────────────────────────────────────────────────

export async function addItem(userId: string, productId: string): Promise<CartDto> {
  const product = await Product.findById(productId).lean()

  if (!product) throw new ErrorHandler('Product not found', 404)
  if (!product.isActive) throw new ErrorHandler('Product is not available', 400)

  const cart = await getOrCreate(userId)

  const alreadyInCart = cart.items.some((i) => i.productId.toString() === productId)
  if (alreadyInCart) throw new ErrorHandler('Product is already in cart', 409)

  cart.items.push({ productId, addedAt: new Date() } as any)
  // Slide expiry forward on each interaction
  cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await cart.save()

  const productIds = cart.items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds } }).lean()
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  return toCartDto(cart, productMap as any)
}

// ─── Remove Item ─────────────────────────────────────────────────────────────

export async function removeItem(userId: string, productId: string): Promise<CartDto> {
  const cart = await Cart.findOne({ userId, status: CartStatus.Active })
  if (!cart) throw new ErrorHandler('Cart not found', 404)

  const idx = cart.items.findIndex((i) => i.productId.toString() === productId)
  if (idx === -1) throw new ErrorHandler('Product is not in cart', 404)

  cart.items.splice(idx, 1)
  await cart.save()

  const productIds = cart.items.map((i) => i.productId)
  const products =
    productIds.length > 0 ? await Product.find({ _id: { $in: productIds } }).lean() : []
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  return toCartDto(cart, productMap as any)
}

// ─── Clear Items ─────────────────────────────────────────────────────────────

export async function clearItems(userId: string): Promise<void> {
  await Cart.updateOne({ userId, status: CartStatus.Active }, { $set: { items: [] } })
}

// ─── Merge Guest Cart ────────────────────────────────────────────────────────

export async function mergeGuestItems(
  userId: string,
  productIds: string[],
): Promise<CartDto> {
  const cart = await getOrCreate(userId)

  const uniqueNew = [...new Set(productIds)]

  const products = await Product.find({ _id: { $in: uniqueNew }, isActive: true }).lean()

  const validIds = new Set(products.map((p) => p._id.toString()))

  const existingIds = new Set(cart.items.map((i) => i.productId.toString()))

  for (const id of validIds) {
    if (!existingIds.has(id)) {
      cart.items.push({ productId: id, addedAt: new Date() } as any)
    }
  }

  cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await cart.save()

  const allProductIds = cart.items.map((i) => i.productId)
  const allProducts = await Product.find({ _id: { $in: allProductIds } }).lean()
  const productMap = new Map(allProducts.map((p) => [p._id.toString(), p]))

  return toCartDto(cart, productMap as any)
}

// ─── Mark Checked Out (called from webhook after payment) ────────────────────

export async function markCheckedOut(cartId: string): Promise<void> {
  await Cart.updateOne({ _id: cartId }, { $set: { status: CartStatus.CheckedOut } })
}

// ─── Get Cart for Checkout (validates & returns items for LS) ────────────────

export interface CartCheckoutData {
  cartId: string;
  productIds: string[];
  totalInCents: number;
}

export async function getCartForCheckout(userId: string): Promise<CartCheckoutData> {
  const cart = await Cart.findOne({ userId, status: CartStatus.Active })
  if (!cart || cart.items.length === 0) throw new ErrorHandler('Cart is empty', 400)

  const productIds = cart.items.map((i) => i.productId.toString())
  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean()

  if (products.length === 0) throw new ErrorHandler('No valid products in cart', 400)

  return {
    cartId: cart._id.toString(),
    productIds: products.map((p) => p._id.toString()),
    totalInCents: 0,
  }
}

// ─── Cleanup: remove checked_out carts older than 90 days ────────────────────

export async function cleanOldCheckedOutCarts(): Promise<void> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  await Cart.deleteMany({ status: CartStatus.CheckedOut, updatedAt: { $lt: cutoff } })
}

// ─── Remove a product from all carts (cleanup on product deletion) ────────────

export async function removeProductFromAllCarts(productId: string): Promise<void> {
  await Cart.updateMany(
    { 'items.productId': productId },
    { $pull: { items: { productId } } },
  )
}
