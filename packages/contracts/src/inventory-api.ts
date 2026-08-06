import type { PageRequest, PageResponse } from './pagination.js';
import type {
  AdjustStockCommand,
  ChangeStockReservationStatusCommand,
  CreateInventoryItemCommand,
  InventoryItem,
  InventoryItemStatus,
  ReserveStockCommand,
  StockMovement,
  StockMovementType,
  StockReservation,
  StockReservationStatus,
  TransferStockCommand,
} from './inventory.js';

export const INVENTORY_API_ROUTES = {
  createItem: '/v1/merchant/inventory/items',
  listItems: '/v1/merchant/inventory/items',
  getItem: '/v1/merchant/inventory/items/:inventoryItemId',
  adjustStock: '/v1/merchant/inventory/items/:inventoryItemId/adjustments',
  transferStock: '/v1/merchant/inventory/transfers',
  listMovements: '/v1/merchant/inventory/movements',
  reserveStock: '/v1/merchant/inventory/reservations',
  getReservation: '/v1/merchant/inventory/reservations/:reservationId',
  changeReservationStatus: '/v1/merchant/inventory/reservations/:reservationId/status',
} as const;

export const INVENTORY_API_METHODS = {
  createItem: 'POST',
  listItems: 'GET',
  getItem: 'GET',
  adjustStock: 'POST',
  transferStock: 'POST',
  listMovements: 'GET',
  reserveStock: 'POST',
  getReservation: 'GET',
  changeReservationStatus: 'POST',
} as const;

export type InventoryApiRouteName = keyof typeof INVENTORY_API_ROUTES;

export interface ListInventoryItemsQuery extends PageRequest {
  merchantId: string;
  locationId?: string;
  productId?: string;
  variantId?: string;
  sku?: string;
  status?: InventoryItemStatus;
  lowStockOnly?: boolean;
}

export interface ListStockMovementsQuery extends PageRequest {
  merchantId: string;
  locationId?: string;
  inventoryItemId?: string;
  type?: StockMovementType;
  referenceType?: string;
  referenceId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface ListStockReservationsQuery extends PageRequest {
  merchantId: string;
  locationId?: string;
  orderId?: string;
  status?: StockReservationStatus;
}

export interface InventoryApiContract {
  createItem: {
    method: typeof INVENTORY_API_METHODS.createItem;
    path: typeof INVENTORY_API_ROUTES.createItem;
    request: CreateInventoryItemCommand;
    response: InventoryItem;
  };
  listItems: {
    method: typeof INVENTORY_API_METHODS.listItems;
    path: typeof INVENTORY_API_ROUTES.listItems;
    request: ListInventoryItemsQuery;
    response: PageResponse<InventoryItem>;
  };
  getItem: {
    method: typeof INVENTORY_API_METHODS.getItem;
    path: typeof INVENTORY_API_ROUTES.getItem;
    request: { inventoryItemId: string };
    response: InventoryItem;
  };
  adjustStock: {
    method: typeof INVENTORY_API_METHODS.adjustStock;
    path: typeof INVENTORY_API_ROUTES.adjustStock;
    request: AdjustStockCommand;
    response: StockMovement;
  };
  transferStock: {
    method: typeof INVENTORY_API_METHODS.transferStock;
    path: typeof INVENTORY_API_ROUTES.transferStock;
    request: TransferStockCommand;
    response: { debit: StockMovement; credit: StockMovement };
  };
  listMovements: {
    method: typeof INVENTORY_API_METHODS.listMovements;
    path: typeof INVENTORY_API_ROUTES.listMovements;
    request: ListStockMovementsQuery;
    response: PageResponse<StockMovement>;
  };
  reserveStock: {
    method: typeof INVENTORY_API_METHODS.reserveStock;
    path: typeof INVENTORY_API_ROUTES.reserveStock;
    request: ReserveStockCommand;
    response: StockReservation;
  };
  getReservation: {
    method: typeof INVENTORY_API_METHODS.getReservation;
    path: typeof INVENTORY_API_ROUTES.getReservation;
    request: { reservationId: string };
    response: StockReservation;
  };
  changeReservationStatus: {
    method: typeof INVENTORY_API_METHODS.changeReservationStatus;
    path: typeof INVENTORY_API_ROUTES.changeReservationStatus;
    request: ChangeStockReservationStatusCommand;
    response: StockReservation;
  };
}
