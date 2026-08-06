import type { PageResponse } from './pagination.js';
import type {
  CancelInvoiceCommand,
  CreateInvoiceCommand,
  InvoiceDeliveryChannel,
  InvoiceStatus,
  IssueInvoiceCommand,
  MerchantInvoice,
  RecordInvoicePaymentCommand,
} from './invoice.js';

export const INVOICE_API_ROUTES = {
  list: '/v1/merchant/invoices',
  create: '/v1/merchant/invoices',
  get: '/v1/merchant/invoices/:invoiceId',
  issue: '/v1/merchant/invoices/:invoiceId/issue',
  recordPayment: '/v1/merchant/invoices/:invoiceId/payments',
  cancel: '/v1/merchant/invoices/:invoiceId/cancel',
  download: '/v1/merchant/invoices/:invoiceId/document',
} as const;

export const INVOICE_API_METHODS = {
  list: 'GET',
  create: 'POST',
  get: 'GET',
  issue: 'POST',
  recordPayment: 'POST',
  cancel: 'POST',
  download: 'GET',
} as const;

export type InvoiceApiRouteName = keyof typeof INVOICE_API_ROUTES;

export interface ListInvoicesQuery {
  merchantId: string;
  locationId?: string;
  customerId?: string;
  orderId?: string;
  statuses?: InvoiceStatus[];
  issuedFrom?: string;
  issuedTo?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceDocumentResponse {
  invoiceId: string;
  fileName: string;
  contentType: 'application/pdf';
  downloadUrl: string;
  expiresAt: string;
}

export interface InvoiceDeliveryResult {
  invoiceId: string;
  requestedChannels: InvoiceDeliveryChannel[];
  deliveryIds: string[];
}

export interface InvoiceApiContract {
  list(query: ListInvoicesQuery): Promise<PageResponse<MerchantInvoice>>;
  create(command: CreateInvoiceCommand): Promise<MerchantInvoice>;
  get(invoiceId: string): Promise<MerchantInvoice>;
  issue(command: IssueInvoiceCommand): Promise<InvoiceDeliveryResult>;
  recordPayment(command: RecordInvoicePaymentCommand): Promise<MerchantInvoice>;
  cancel(command: CancelInvoiceCommand): Promise<MerchantInvoice>;
  download(invoiceId: string): Promise<InvoiceDocumentResponse>;
}
