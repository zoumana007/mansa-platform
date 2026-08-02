export const PAYMENT_ATTEMPT_STATUSES = [
  'CREATED',
  'PROCESSING',
  'AUTHORIZED',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'UNKNOWN',
] as const;

export const PAYMENT_FAILURE_CATEGORIES = [
  'BUSINESS',
  'AUTHENTICATION',
  'LIMIT',
  'FRAUD',
  'TEMPORARY',
  'TECHNICAL',
  'UNKNOWN',
] as const;

export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];
export type PaymentFailureCategory = (typeof PAYMENT_FAILURE_CATEGORIES)[number];

export interface PaymentAttempt {
  readonly attemptId: string;
  readonly paymentId: string;
  readonly routeId: string;
  readonly providerId: string;
  readonly idempotencyKey: string;
  readonly sequence: number;
  readonly status: PaymentAttemptStatus;
  readonly providerReference?: string;
  readonly failureCategory?: PaymentFailureCategory;
  readonly failureCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatePaymentAttemptCommand {
  readonly attemptId: string;
  readonly paymentId: string;
  readonly routeId: string;
  readonly providerId: string;
  readonly idempotencyKey: string;
  readonly sequence: number;
  readonly createdAt: string;
}

export interface TransitionPaymentAttemptCommand {
  readonly status: PaymentAttemptStatus;
  readonly updatedAt: string;
  readonly providerReference?: string;
  readonly failureCategory?: PaymentFailureCategory;
  readonly failureCode?: string;
}

const ALLOWED_TRANSITIONS: Readonly<Record<PaymentAttemptStatus, readonly PaymentAttemptStatus[]>> = {
  CREATED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['AUTHORIZED', 'SUCCEEDED', 'FAILED', 'UNKNOWN', 'CANCELLED'],
  AUTHORIZED: ['SUCCEEDED', 'FAILED', 'UNKNOWN'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
  UNKNOWN: ['AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
};

export function isPaymentAttemptStatus(value: string): value is PaymentAttemptStatus {
  return PAYMENT_ATTEMPT_STATUSES.includes(value as PaymentAttemptStatus);
}

export function isPaymentFailureCategory(value: string): value is PaymentFailureCategory {
  return PAYMENT_FAILURE_CATEGORIES.includes(value as PaymentFailureCategory);
}

export function isFinalPaymentAttemptStatus(status: PaymentAttemptStatus): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELLED';
}

export function canTransitionPaymentAttempt(
  currentStatus: PaymentAttemptStatus,
  nextStatus: PaymentAttemptStatus,
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function createPaymentAttempt(command: CreatePaymentAttemptCommand): PaymentAttempt {
  if (command.sequence < 1 || !Number.isInteger(command.sequence)) {
    throw new Error('sequence must be a positive integer');
  }
  if (!command.attemptId || !command.paymentId || !command.routeId || !command.providerId) {
    throw new Error('payment attempt identifiers are required');
  }
  if (!command.idempotencyKey) throw new Error('idempotencyKey is required');

  return {
    ...command,
    status: 'CREATED',
    updatedAt: command.createdAt,
  };
}

export function transitionPaymentAttempt(
  attempt: PaymentAttempt,
  command: TransitionPaymentAttemptCommand,
): PaymentAttempt {
  if (!canTransitionPaymentAttempt(attempt.status, command.status)) {
    throw new Error(`Invalid payment attempt transition: ${attempt.status} -> ${command.status}`);
  }

  if (command.status === 'FAILED' && command.failureCategory === undefined) {
    throw new Error('failureCategory is required for a failed attempt');
  }

  if (command.status !== 'FAILED' && (command.failureCategory !== undefined || command.failureCode !== undefined)) {
    throw new Error('failure details are only allowed for a failed attempt');
  }

  return {
    ...attempt,
    status: command.status,
    updatedAt: command.updatedAt,
    providerReference: command.providerReference ?? attempt.providerReference,
    failureCategory: command.failureCategory,
    failureCode: command.failureCode,
  };
}

export function isRetryablePaymentFailure(category: PaymentFailureCategory | undefined): boolean {
  return category === 'TEMPORARY' || category === 'TECHNICAL' || category === 'UNKNOWN';
}
