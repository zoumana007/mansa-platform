import type { PageRequest, PageResponse } from './pagination.js';

export const SUPPORT_TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];

export const SUPPORT_TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_PARTNER',
  'RESOLVED',
  'CLOSED',
] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_CATEGORIES = [
  'ACCOUNT',
  'KYC',
  'TRANSFER',
  'PAYMENT',
  'CARD',
  'MERCHANT',
  'TERMINAL',
  'PUBLIC_SERVICE',
  'SECURITY',
  'OTHER',
] as const;
export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export interface CreateSupportTicketCommand {
  readonly requesterUserId: string;
  readonly category: SupportTicketCategory;
  readonly priority?: SupportTicketPriority;
  readonly subject: string;
  readonly description: string;
  readonly transactionId?: string;
  readonly attachmentIds?: readonly string[];
}

export interface SupportMessage {
  readonly id: string;
  readonly authorId: string;
  readonly authorType: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
  readonly body: string;
  readonly attachmentIds: readonly string[];
  readonly createdAt: string;
}

export interface SupportTicket {
  readonly id: string;
  readonly reference: string;
  readonly requesterUserId: string;
  readonly assigneeUserId?: string;
  readonly category: SupportTicketCategory;
  readonly priority: SupportTicketPriority;
  readonly status: SupportTicketStatus;
  readonly subject: string;
  readonly transactionId?: string;
  readonly messages: readonly SupportMessage[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
}

export interface UpdateSupportTicketCommand {
  readonly ticketId: string;
  readonly status?: SupportTicketStatus;
  readonly priority?: SupportTicketPriority;
  readonly assigneeUserId?: string;
  readonly message?: string;
}

export interface AddSupportMessageCommand {
  readonly ticketId: string;
  readonly authorId: string;
  readonly authorType: SupportMessage['authorType'];
  readonly body: string;
  readonly attachmentIds?: readonly string[];
}

export const SUPPORT_API_ROUTES = {
  createTicket: '/v1/support/tickets',
  listTickets: '/v1/support/tickets',
  getTicket: '/v1/support/tickets/:ticketId',
  updateTicket: '/v1/support/tickets/:ticketId',
  addMessage: '/v1/support/tickets/:ticketId/messages',
} as const;

export const SUPPORT_API_METHODS = {
  createTicket: 'POST',
  listTickets: 'GET',
  getTicket: 'GET',
  updateTicket: 'PATCH',
  addMessage: 'POST',
} as const;

export type SupportApiRouteName = keyof typeof SUPPORT_API_ROUTES;

export interface ListSupportTicketsQuery extends PageRequest {
  readonly requesterUserId?: string;
  readonly assigneeUserId?: string;
  readonly category?: SupportTicketCategory;
  readonly priority?: SupportTicketPriority;
  readonly status?: SupportTicketStatus;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface SupportApiContract {
  readonly createTicket: {
    readonly request: CreateSupportTicketCommand;
    readonly response: SupportTicket;
  };
  readonly listTickets: {
    readonly request: ListSupportTicketsQuery;
    readonly response: PageResponse<SupportTicket>;
  };
  readonly getTicket: {
    readonly request: { readonly ticketId: string };
    readonly response: SupportTicket;
  };
  readonly updateTicket: {
    readonly request: UpdateSupportTicketCommand;
    readonly response: SupportTicket;
  };
  readonly addMessage: {
    readonly request: AddSupportMessageCommand;
    readonly response: SupportMessage;
  };
}

export function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
}
