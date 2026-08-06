import type { Money } from './money.js';

export const INVOICE_STATUSES = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'REFUNDED',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_DELIVERY_CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PRINT'] as const;
export type InvoiceDeliveryChannel = (typeof INVOICE_DELIVERY_CHANNELS)[number];

export interface InvoiceParty {
  customerId?: string;
  displayName: string;
  phoneMasked?: string;
  emailMasked?: string;
  taxIdentifierMasked?: string;
  address?: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  productId?: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  unitPrice: Money;
  discountAmount: Money;
  taxAmount: Money;
  lineTotal: Money;
}

export interface InvoiceTotals {
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  amountDue: Money;
  amountPaid: Money;
  balanceDue: Money;
}

export interface MerchantInvoice {
  id: string;
  merchantId: string;
  locationId: string;
  invoiceNumber: string;
  orderId?: string;
  status: InvoiceStatus;
  customer: InvoiceParty;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
  currency: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceLineInput {
  description: string;
  productId?: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  unitPrice: Money;
  discountAmount?: Money;
  taxAmount?: Money;
}

export interface CreateInvoiceCommand {
  merchantId: string;
  locationId: string;
  orderId?: string;
  customer: InvoiceParty;
  lines: CreateInvoiceLineInput[];
  dueAt?: string;
  notes?: string;
  createdBy: string;
  idempotencyKey: string;
}

export interface IssueInvoiceCommand {
  invoiceId: string;
  channels: InvoiceDeliveryChannel[];
  actorId: string;
  idempotencyKey: string;
}

export interface RecordInvoicePaymentCommand {
  invoiceId: string;
  paymentId: string;
  amount: Money;
  actorId: string;
  idempotencyKey: string;
}

export interface CancelInvoiceCommand {
  invoiceId: string;
  reason: string;
  actorId: string;
  idempotencyKey: string;
}

const INVOICE_STATUS_TRANSITIONS: Readonly<Record<InvoiceStatus, readonly InvoiceStatus[]>> = {
  DRAFT: ['ISSUED', 'CANCELLED'],
  ISSUED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'],
  PAID: ['REFUNDED'],
  OVERDUE: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus);
}

export function isInvoiceDeliveryChannel(value: string): value is InvoiceDeliveryChannel {
  return INVOICE_DELIVERY_CHANNELS.includes(value as InvoiceDeliveryChannel);
}

export function isValidInvoiceQuantity(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function canTransitionInvoiceStatus(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return INVOICE_STATUS_TRANSITIONS[from].includes(to);
}

export function assertInvoiceCurrencies(invoice: Pick<MerchantInvoice, 'currency' | 'lines' | 'totals'>): void {
  const expectedCurrency = invoice.currency;
  const amounts = [
    ...invoice.lines.flatMap((line) => [
      line.unitPrice,
      line.discountAmount,
      line.taxAmount,
      line.lineTotal,
    ]),
    invoice.totals.subtotal,
    invoice.totals.discountTotal,
    invoice.totals.taxTotal,
    invoice.totals.amountDue,
    invoice.totals.amountPaid,
    invoice.totals.balanceDue,
  ];

  if (amounts.some((amount) => amount.currency !== expectedCurrency)) {
    throw new Error('All invoice amounts must use the invoice currency');
  }
}
