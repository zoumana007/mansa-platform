import type { Money } from './money.js';

export const ORDER_STATUSES = [
  'DRAFT',
  'PENDING_PAYMENT',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_CHANNELS = ['MERCHANT_APP', 'TPE', 'MINI_SITE', 'API'] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const ORDER_FULFILLMENT_TYPES = ['IN_STORE', 'PICKUP', 'DELIVERY', 'DIGITAL'] as const;
export type OrderFulfillmentType = (typeof ORDER_FULFILLMENT_TYPES)[number];

export interface OrderCustomer {
  customerId?: string;
  displayName?: string;
  phoneMasked?: string;
  emailMasked?: string;
}

export interface OrderLine {
  id: string;
  productId: string;
  variantId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  grossAmount: Money;
  discountAmount: Money;
  taxAmount: Money;
  netAmount: Money;
  promotionIds?: string[];
  notes?: string;
}

export interface OrderAmountBreakdown {
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  serviceChargeTotal: Money;
  deliveryFeeTotal: Money;
  tipTotal: Money;
  grandTotal: Money;
}

export interface MerchantOrder {
  id: string;
  merchantId: string;
  locationId: string;
  orderNumber: string;
  channel: OrderChannel;
  fulfillmentType: OrderFulfillmentType;
  status: OrderStatus;
  customer?: OrderCustomer;
  lines: OrderLine[];
  amounts: OrderAmountBreakdown;
  paymentId?: string;
  receiptId?: string;
  stockReservationId?: string;
  currency: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface CreateOrderLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderCommand {
  merchantId: string;
  locationId: string;
  channel: OrderChannel;
  fulfillmentType: OrderFulfillmentType;
  customer?: OrderCustomer;
  lines: CreateOrderLineInput[];
  notes?: string;
  createdBy: string;
  idempotencyKey: string;
}

export interface UpdateOrderCommand {
  orderId: string;
  expectedVersion: number;
  customer?: OrderCustomer;
  lines?: CreateOrderLineInput[];
  fulfillmentType?: OrderFulfillmentType;
  notes?: string;
  actorId: string;
}

export interface ChangeOrderStatusCommand {
  orderId: string;
  targetStatus: OrderStatus;
  actorId: string;
  reason?: string;
  idempotencyKey: string;
}

const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'READY', 'COMPLETED', 'REFUNDED'],
  PREPARING: ['READY', 'CANCELLED', 'REFUNDED'],
  READY: ['COMPLETED', 'CANCELLED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function isOrderChannel(value: string): value is OrderChannel {
  return ORDER_CHANNELS.includes(value as OrderChannel);
}

export function isOrderFulfillmentType(value: string): value is OrderFulfillmentType {
  return ORDER_FULFILLMENT_TYPES.includes(value as OrderFulfillmentType);
}

export function isValidOrderQuantity(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function assertOrderCurrencies(order: Pick<MerchantOrder, 'currency' | 'lines' | 'amounts'>): void {
  const expectedCurrency = order.currency;
  const amounts = [
    ...order.lines.flatMap((line) => [
      line.unitPrice,
      line.grossAmount,
      line.discountAmount,
      line.taxAmount,
      line.netAmount,
    ]),
    order.amounts.subtotal,
    order.amounts.discountTotal,
    order.amounts.taxTotal,
    order.amounts.serviceChargeTotal,
    order.amounts.deliveryFeeTotal,
    order.amounts.tipTotal,
    order.amounts.grandTotal,
  ];

  if (amounts.some((amount) => amount.currency !== expectedCurrency)) {
    throw new Error('All order amounts must use the order currency');
  }
}
