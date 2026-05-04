import type { ICartDocument } from '../models/cart.model'
import type { IProductDocument } from '../models/product.model'
import { toProductDto, type ProductDto } from './product.dto'

export interface CartItemDto {
  productId: string;
  product: ProductDto;
  addedAt: string;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  status: string;
  itemCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export function toCartDto(
  doc: ICartDocument,
  productMap: Map<string, IProductDocument>,
): CartDto {
  const items: CartItemDto[] = doc.items
    .map((item) => {
      const product = productMap.get(item.productId.toString())
      if (!product) return null
      return {
        productId: item.productId.toString(),
        product: toProductDto(product),
        addedAt: item.addedAt.toISOString(),
      }
    })
    .filter((item): item is CartItemDto => item !== null)

  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    items,
    status: doc.status,
    itemCount: items.length,
    expiresAt: doc.expiresAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
