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

export function isSupportTicketStatus(value: string): value is SupportTicketStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
}
