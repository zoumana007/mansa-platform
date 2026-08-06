export const INVENTORY_ITEM_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type InventoryItemStatus = (typeof INVENTORY_ITEM_STATUSES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'RECEIPT',
  'SALE',
  'RETURN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RESERVATION',
  'RESERVATION_RELEASE',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_RESERVATION_STATUSES = ['ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED'] as const;
export type StockReservationStatus = (typeof STOCK_RESERVATION_STATUSES)[number];

export interface InventoryItem {
  id: string;
  merchantId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  status: InventoryItemStatus;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint?: number;
  version: number;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  merchantId: string;
  locationId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  resultingQuantityOnHand: number;
  resultingQuantityReserved: number;
  referenceType: string;
  referenceId: string;
  reason?: string;
  actorId: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface StockReservationLine {
  inventoryItemId: string;
  quantity: number;
}

export interface StockReservation {
  id: string;
  merchantId: string;
  locationId: string;
  orderId: string;
  status: StockReservationStatus;
  lines: StockReservationLine[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemCommand {
  merchantId: string;
  locationId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  initialQuantity?: number;
  reorderPoint?: number;
  actorId: string;
  idempotencyKey: string;
}

export interface AdjustStockCommand {
  inventoryItemId: string;
  quantityDelta: number;
  reason: string;
  expectedVersion: number;
  actorId: string;
  idempotencyKey: string;
}

export interface TransferStockCommand {
  sourceInventoryItemId: string;
  destinationInventoryItemId: string;
  quantity: number;
  reason?: string;
  actorId: string;
  idempotencyKey: string;
}

export interface ReserveStockCommand {
  merchantId: string;
  locationId: string;
  orderId: string;
  lines: StockReservationLine[];
  expiresAt?: string;
  actorId: string;
  idempotencyKey: string;
}

export interface ChangeStockReservationStatusCommand {
  reservationId: string;
  targetStatus: Exclude<StockReservationStatus, 'ACTIVE'>;
  actorId: string;
  reason?: string;
  idempotencyKey: string;
}

export function isInventoryItemStatus(value: string): value is InventoryItemStatus {
  return INVENTORY_ITEM_STATUSES.includes(value as InventoryItemStatus);
}

export function isStockMovementType(value: string): value is StockMovementType {
  return STOCK_MOVEMENT_TYPES.includes(value as StockMovementType);
}

export function isStockReservationStatus(value: string): value is StockReservationStatus {
  return STOCK_RESERVATION_STATUSES.includes(value as StockReservationStatus);
}

export function isValidStockQuantity(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function isValidPositiveStockQuantity(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function getAvailableStock(
  item: Pick<InventoryItem, 'quantityOnHand' | 'quantityReserved'>,
): number {
  return item.quantityOnHand - item.quantityReserved;
}

export function canReserveStock(
  item: Pick<InventoryItem, 'status' | 'quantityOnHand' | 'quantityReserved'>,
  quantity: number,
): boolean {
  return item.status === 'ACTIVE' && isValidPositiveStockQuantity(quantity) && getAvailableStock(item) >= quantity;
}
