export type TransactionState =
  | "PENDING"
  | "AUTHORIZED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REVERSED";

export class InvalidTransactionTransitionError extends Error {
  constructor(
    public readonly from: TransactionState,
    public readonly to: TransactionState,
  ) {
    super(`transaction cannot transition from ${from} to ${to}`);
    this.name = "InvalidTransactionTransitionError";
  }
}

const ALLOWED_TRANSITIONS: Readonly<
  Record<TransactionState, readonly TransactionState[]>
> = Object.freeze({
  PENDING: Object.freeze(["AUTHORIZED", "PROCESSING", "FAILED", "CANCELLED"]),
  AUTHORIZED: Object.freeze(["PROCESSING", "FAILED", "CANCELLED"]),
  PROCESSING: Object.freeze(["SUCCEEDED", "FAILED", "CANCELLED"]),
  SUCCEEDED: Object.freeze(["REVERSED"]),
  FAILED: Object.freeze([]),
  CANCELLED: Object.freeze([]),
  REVERSED: Object.freeze([]),
});

export function allowedTransactionTransitions(
  state: TransactionState,
): readonly TransactionState[] {
  return ALLOWED_TRANSITIONS[state];
}

export function canTransitionTransaction(
  from: TransactionState,
  to: TransactionState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransactionTransition(
  from: TransactionState,
  to: TransactionState,
): void {
  if (!canTransitionTransaction(from, to)) {
    throw new InvalidTransactionTransitionError(from, to);
  }
}
