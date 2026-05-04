import type { Request, Response } from 'express'
import { CatchAsyncErrors } from '../middlewares/error.middleware'
import * as cartService from '../services/cart.service'
import * as lsService from '../services/lemonsqueezy.service'
import { Product } from '../models/product.model'
import { success } from '../utils/response.util'
import type { AddCartItemInput, MergeCartInput } from '../validators/cart.validator'

// ─── GET /carts/me ────────────────────────────────────────────────────────────

export const get = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const cart = await cartService.getCart(req.user!._id.toString())
  success(res, cart)
})

// ─── POST /carts/items ────────────────────────────────────────────────────────

export const addItem = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.body as AddCartItemInput
  const cart = await cartService.addItem(req.user!._id.toString(), productId)
  success(res, cart, 201, 'Item added to cart')
})

// ─── DELETE /carts/items/:productId ──────────────────────────────────────────

export const removeItem = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const cart = await cartService.removeItem(req.user!._id.toString(), req.params.productId)
  success(res, cart, 200, 'Item removed from cart')
})

// ─── DELETE /carts/items ──────────────────────────────────────────────────────

export const clear = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await cartService.clearItems(req.user!._id.toString())
  success(res, null, 200, 'Cart cleared')
})

// ─── POST /carts/merge ────────────────────────────────────────────────────────

export const merge = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { items } = req.body as MergeCartInput
  const productIds = items.map((i) => i.productId)
  const cart = await cartService.mergeGuestItems(req.user!._id.toString(), productIds)
  success(res, cart, 200, 'Cart merged successfully')
})

// ─── POST /carts/checkout ─────────────────────────────────────────────────────

export const checkout = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString()
  const { cartId, productIds, totalInCents } = await cartService.getCartForCheckout(userId)

  const products = await Product.find({ _id: { $in: productIds } }).lean()
  const isSingle = products.length === 1

  const checkoutName = isSingle
    ? products[0].name.en
    : `3D Model Bundle (${products.length} items)`

  const description = isSingle
    ? products[0].description?.en || undefined
    : products.map((p) => `• ${p.name.en}`).join('\n')

  const thumbnailUrl = isSingle ? products[0].thumbnail || undefined : undefined

  const checkoutUrl = await lsService.createCheckout({
    userId,
    cartId,
    productIds,
    totalInCents,
    checkoutName,
    productDescription: description,
    thumbnailUrl,
  })

  success(res, { checkoutUrl })
})
