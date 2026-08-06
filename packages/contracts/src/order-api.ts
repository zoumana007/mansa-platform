import type { PageRequest, PageResponse } from './pagination.js';
import type {
  ChangeOrderStatusCommand,
  CreateOrderCommand,
  MerchantOrder,
  OrderChannel,
  OrderFulfillmentType,
  OrderStatus,
  UpdateOrderCommand,
} from './order.js';

export const ORDER_API_ROUTES = {
  create: '/v1/merchant/orders',
  list: '/v1/merchant/orders',
  get: '/v1/merchant/orders/:orderId',
  update: '/v1/merchant/orders/:orderId',
  changeStatus: '/v1/merchant/orders/:orderId/status',
} as const;

export const ORDER_API_METHODS = {
  create: 'POST',
  list: 'GET',
  get: 'GET',
  update: 'PATCH',
  changeStatus: 'POST',
} as const;

export type OrderApiRouteName = keyof typeof ORDER_API_ROUTES;

export interface ListOrdersQuery extends PageRequest {
  merchantId: string;
  locationId?: string;
  status?: OrderStatus;
  channel?: OrderChannel;
  fulfillmentType?: OrderFulfillmentType;
  customerId?: string;
  paymentId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface OrderApiContract {
  create: {
    method: typeof ORDER_API_METHODS.create;
    path: typeof ORDER_API_ROUTES.create;
    request: CreateOrderCommand;
    response: MerchantOrder;
  };
  list: {
    method: typeof ORDER_API_METHODS.list;
    path: typeof ORDER_API_ROUTES.list;
    request: ListOrdersQuery;
    response: PageResponse<MerchantOrder>;
  };
  get: {
    method: typeof ORDER_API_METHODS.get;
    path: typeof ORDER_API_ROUTES.get;
    request: { orderId: string };
    response: MerchantOrder;
  };
  update: {
    method: typeof ORDER_API_METHODS.update;
    path: typeof ORDER_API_ROUTES.update;
    request: UpdateOrderCommand;
    response: MerchantOrder;
  };
  changeStatus: {
    method: typeof ORDER_API_METHODS.changeStatus;
    path: typeof ORDER_API_ROUTES.changeStatus;
    request: ChangeOrderStatusCommand;
    response: MerchantOrder;
  };
}
