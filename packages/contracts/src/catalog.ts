import type { Money } from './money.js';

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_TYPES = ['PHYSICAL', 'SERVICE', 'DIGITAL'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const INVENTORY_TRACKING_MODES = ['NONE', 'FINITE', 'UNLIMITED'] as const;
export type InventoryTrackingMode = (typeof INVENTORY_TRACKING_MODES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'INITIAL',
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RESERVATION',
  'RELEASE',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export interface ProductCategory {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  price: Money;
  attributes: Record<string, string>;
  active: boolean;
}

export interface MerchantProduct {
  id: string;
  merchantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  type: ProductType;
  status: ProductStatus;
  sku?: string;
  barcode?: string;
  basePrice: Money;
  taxCategoryCode?: string;
  imageAssetIds?: string[];
  variants: ProductVariant[];
  inventoryTrackingMode: InventoryTrackingMode;
  availableLocationIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBalance {
  merchantId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderThreshold?: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  merchantId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  actorId: string;
  occurredAt: string;
}

export interface CreateProductCommand {
  merchantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  type: ProductType;
  sku?: string;
  barcode?: string;
  basePrice: Money;
  taxCategoryCode?: string;
  imageAssetIds?: string[];
  variants?: Omit<ProductVariant, 'id' | 'productId'>[];
  inventoryTrackingMode: InventoryTrackingMode;
  availableLocationIds?: string[];
}

export interface UpdateProductCommand {
  productId: string;
  categoryId?: string;
  name?: string;
  description?: string;
  status?: ProductStatus;
  basePrice?: Money;
  taxCategoryCode?: string;
  imageAssetIds?: string[];
  inventoryTrackingMode?: InventoryTrackingMode;
  availableLocationIds?: string[];
}

export interface AdjustStockCommand {
  merchantId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  type: 'INITIAL' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  reason: string;
  actorId: string;
  idempotencyKey: string;
}

export interface ReserveStockCommand {
  merchantId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  orderId: string;
  idempotencyKey: string;
}

export function isProductStatus(value: string): value is ProductStatus {
  return PRODUCT_STATUSES.includes(value as ProductStatus);
}

export function isProductType(value: string): value is ProductType {
  return PRODUCT_TYPES.includes(value as ProductType);
}

export function isInventoryTrackingMode(value: string): value is InventoryTrackingMode {
  return INVENTORY_TRACKING_MODES.includes(value as InventoryTrackingMode);
}

export function isStockMovementType(value: string): value is StockMovementType {
  return STOCK_MOVEMENT_TYPES.includes(value as StockMovementType);
}

export function isValidStockQuantity(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function calculateAvailableQuantity(onHandQuantity: number, reservedQuantity: number): number {
  if (!Number.isSafeInteger(onHandQuantity) || !Number.isSafeInteger(reservedQuantity)) {
    throw new TypeError('Stock quantities must be safe integers');
  }

  return onHandQuantity - reservedQuantity;
}
