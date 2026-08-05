import type { PageResponse } from './pagination.js';
import type {
  AddDisputeEvidenceCommand,
  Dispute,
  DisputeReason,
  DisputeStatus,
  OpenDisputeCommand,
  TransitionDisputeCommand,
} from './dispute.js';

export const DISPUTE_API_ROUTES = {
  disputes: '/v1/disputes',
  disputeById: '/v1/disputes/:disputeId',
  evidence: '/v1/disputes/:disputeId/evidence',
  transitionDispute: '/v1/disputes/:disputeId/status',
} as const;

export const DISPUTE_API_METHODS = {
  listDisputes: 'GET',
  getDispute: 'GET',
  openDispute: 'POST',
  addEvidence: 'POST',
  transitionDispute: 'POST',
} as const;

export interface ListDisputesQuery {
  readonly paymentId?: string;
  readonly status?: DisputeStatus;
  readonly reason?: DisputeReason;
  readonly overdueOnly?: boolean;
  readonly openedFrom?: string;
  readonly openedTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface OpenDisputeRequest extends Omit<OpenDisputeCommand, 'disputeId' | 'openedAt'> {
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface AddDisputeEvidenceRequest extends AddDisputeEvidenceCommand {
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface TransitionDisputeRequest extends TransitionDisputeCommand {
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface DisputeApiContract {
  readonly listDisputes: {
    readonly method: typeof DISPUTE_API_METHODS.listDisputes;
    readonly route: typeof DISPUTE_API_ROUTES.disputes;
    readonly query: ListDisputesQuery;
    readonly response: PageResponse<Dispute>;
  };
  readonly getDispute: {
    readonly method: typeof DISPUTE_API_METHODS.getDispute;
    readonly route: typeof DISPUTE_API_ROUTES.disputeById;
    readonly response: Dispute;
  };
  readonly openDispute: {
    readonly method: typeof DISPUTE_API_METHODS.openDispute;
    readonly route: typeof DISPUTE_API_ROUTES.disputes;
    readonly request: OpenDisputeRequest;
    readonly response: Dispute;
  };
  readonly addEvidence: {
    readonly method: typeof DISPUTE_API_METHODS.addEvidence;
    readonly route: typeof DISPUTE_API_ROUTES.evidence;
    readonly request: AddDisputeEvidenceRequest;
    readonly response: Dispute;
  };
  readonly transitionDispute: {
    readonly method: typeof DISPUTE_API_METHODS.transitionDispute;
    readonly route: typeof DISPUTE_API_ROUTES.transitionDispute;
    readonly request: TransitionDisputeRequest;
    readonly response: Dispute;
  };
}
