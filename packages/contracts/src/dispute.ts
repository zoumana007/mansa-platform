export const DISPUTE_STATUSES = [
  'OPENED',
  'EVIDENCE_REQUIRED',
  'UNDER_REVIEW',
  'WON',
  'LOST',
  'WITHDRAWN',
  'EXPIRED',
] as const;

export const DISPUTE_REASONS = [
  'CARDHOLDER_NOT_PRESENT',
  'DUPLICATE_CHARGE',
  'FRAUDULENT_TRANSACTION',
  'GOODS_NOT_RECEIVED',
  'GOODS_NOT_AS_DESCRIBED',
  'CREDIT_NOT_PROCESSED',
  'CANCELLED_RECURRING_PAYMENT',
  'OTHER',
] as const;

export const DISPUTE_EVIDENCE_TYPES = [
  'TRANSACTION_RECEIPT',
  'DELIVERY_PROOF',
  'CUSTOMER_COMMUNICATION',
  'REFUND_PROOF',
  'TERMS_ACCEPTANCE',
  'IDENTITY_VERIFICATION',
  'OTHER',
] as const;

export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];
export type DisputeReason = (typeof DISPUTE_REASONS)[number];
export type DisputeEvidenceType = (typeof DISPUTE_EVIDENCE_TYPES)[number];

export interface DisputeEvidence {
  readonly evidenceId: string;
  readonly type: DisputeEvidenceType;
  readonly storageReference: string;
  readonly submittedBy: string;
  readonly submittedAt: string;
}

export interface Dispute {
  readonly disputeId: string;
  readonly paymentId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly reason: DisputeReason;
  readonly status: DisputeStatus;
  readonly openedAt: string;
  readonly responseDeadlineAt: string;
  readonly providerReference?: string;
  readonly resolutionNote?: string;
  readonly evidence: readonly DisputeEvidence[];
  readonly updatedAt: string;
}

export interface OpenDisputeCommand {
  readonly disputeId: string;
  readonly paymentId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly reason: DisputeReason;
  readonly openedAt: string;
  readonly responseDeadlineAt: string;
  readonly providerReference?: string;
  readonly evidenceRequired?: boolean;
}

export interface AddDisputeEvidenceCommand {
  readonly evidenceId: string;
  readonly type: DisputeEvidenceType;
  readonly storageReference: string;
  readonly submittedBy: string;
  readonly submittedAt: string;
}

export interface TransitionDisputeCommand {
  readonly status: DisputeStatus;
  readonly updatedAt: string;
  readonly resolutionNote?: string;
}

const ALLOWED_TRANSITIONS: Readonly<Record<DisputeStatus, readonly DisputeStatus[]>> = {
  OPENED: ['EVIDENCE_REQUIRED', 'UNDER_REVIEW', 'WITHDRAWN', 'EXPIRED'],
  EVIDENCE_REQUIRED: ['UNDER_REVIEW', 'WITHDRAWN', 'EXPIRED'],
  UNDER_REVIEW: ['WON', 'LOST', 'WITHDRAWN'],
  WON: [],
  LOST: [],
  WITHDRAWN: [],
  EXPIRED: [],
};

export function isDisputeStatus(value: string): value is DisputeStatus {
  return DISPUTE_STATUSES.includes(value as DisputeStatus);
}

export function isDisputeReason(value: string): value is DisputeReason {
  return DISPUTE_REASONS.includes(value as DisputeReason);
}

export function isDisputeEvidenceType(value: string): value is DisputeEvidenceType {
  return DISPUTE_EVIDENCE_TYPES.includes(value as DisputeEvidenceType);
}

export function isFinalDisputeStatus(status: DisputeStatus): boolean {
  return status === 'WON' || status === 'LOST' || status === 'WITHDRAWN' || status === 'EXPIRED';
}

export function canTransitionDispute(currentStatus: DisputeStatus, nextStatus: DisputeStatus): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function openDispute(command: OpenDisputeCommand): Dispute {
  if (!command.disputeId || !command.paymentId) {
    throw new Error('disputeId and paymentId are required');
  }
  if (!Number.isSafeInteger(command.amountMinor) || command.amountMinor <= 0) {
    throw new Error('amountMinor must be a positive safe integer');
  }
  const currency = command.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency must be a three-letter code');
  if (Date.parse(command.responseDeadlineAt) <= Date.parse(command.openedAt)) {
    throw new Error('responseDeadlineAt must be after openedAt');
  }

  return {
    disputeId: command.disputeId,
    paymentId: command.paymentId,
    amountMinor: command.amountMinor,
    currency,
    reason: command.reason,
    status: command.evidenceRequired ? 'EVIDENCE_REQUIRED' : 'OPENED',
    openedAt: command.openedAt,
    responseDeadlineAt: command.responseDeadlineAt,
    providerReference: command.providerReference,
    evidence: [],
    updatedAt: command.openedAt,
  };
}

export function addDisputeEvidence(
  dispute: Dispute,
  command: AddDisputeEvidenceCommand,
): Dispute {
  if (isFinalDisputeStatus(dispute.status)) {
    throw new Error('cannot add evidence to a final dispute');
  }
  if (!command.evidenceId || !command.storageReference || !command.submittedBy) {
    throw new Error('evidence identifiers, storageReference and submittedBy are required');
  }
  if (dispute.evidence.some((item) => item.evidenceId === command.evidenceId)) {
    throw new Error('evidenceId already exists');
  }

  return {
    ...dispute,
    evidence: [...dispute.evidence, command],
    updatedAt: command.submittedAt,
  };
}

export function transitionDispute(
  dispute: Dispute,
  command: TransitionDisputeCommand,
): Dispute {
  if (!canTransitionDispute(dispute.status, command.status)) {
    throw new Error(`Invalid dispute transition: ${dispute.status} -> ${command.status}`);
  }
  if ((command.status === 'WON' || command.status === 'LOST') && !command.resolutionNote) {
    throw new Error('resolutionNote is required for a resolved dispute');
  }
  if (command.status === 'UNDER_REVIEW' && dispute.evidence.length === 0) {
    throw new Error('at least one evidence item is required before review');
  }

  return {
    ...dispute,
    status: command.status,
    resolutionNote: command.resolutionNote,
    updatedAt: command.updatedAt,
  };
}

export function isDisputeResponseOverdue(dispute: Dispute, now: string): boolean {
  return !isFinalDisputeStatus(dispute.status) && Date.parse(now) > Date.parse(dispute.responseDeadlineAt);
}
