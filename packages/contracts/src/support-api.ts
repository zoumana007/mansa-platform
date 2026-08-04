import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CreateSupportTicketCommand,
  SupportMessage,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  UpdateSupportTicketCommand,
} from './support.js';

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

export interface ListSupportTicketsQuery extends PageRequest {
  requesterUserId?: string;
  assigneeUserId?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  status?: SupportTicketStatus;
  createdFrom?: string;
  createdTo?: string;
}

export interface AddSupportMessageCommand {
  readonly ticketId: string;
  readonly authorId: string;
  readonly body: string;
  readonly attachmentIds?: readonly string[];
  readonly internal?: boolean;
  readonly idempotencyKey: string;
}

export interface SupportApiContract {
  createTicket: {
    method: typeof SUPPORT_API_METHODS.createTicket;
    path: typeof SUPPORT_API_ROUTES.createTicket;
    request: CreateSupportTicketCommand & { readonly idempotencyKey: string };
    response: SupportTicket;
  };
  listTickets: {
    method: typeof SUPPORT_API_METHODS.listTickets;
    path: typeof SUPPORT_API_ROUTES.listTickets;
    request: ListSupportTicketsQuery;
    response: PageResponse<SupportTicket>;
  };
  getTicket: {
    method: typeof SUPPORT_API_METHODS.getTicket;
    path: typeof SUPPORT_API_ROUTES.getTicket;
    request: { ticketId: string };
    response: SupportTicket;
  };
  updateTicket: {
    method: typeof SUPPORT_API_METHODS.updateTicket;
    path: typeof SUPPORT_API_ROUTES.updateTicket;
    request: UpdateSupportTicketCommand & { readonly actorId: string; readonly reason: string; readonly idempotencyKey: string };
    response: SupportTicket;
  };
  addMessage: {
    method: typeof SUPPORT_API_METHODS.addMessage;
    path: typeof SUPPORT_API_ROUTES.addMessage;
    request: AddSupportMessageCommand;
    response: SupportMessage;
  };
}
