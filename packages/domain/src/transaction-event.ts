import type { TransactionKind } from "./transaction.js";
import type { TransactionState } from "./transaction-state.js";

export type TransactionEventName =
  | "TRANSACTION_CREATED"
  | "TRANSACTION_STATE_CHANGED";

export type TransactionEvent = Readonly<{
  id: string;
  name: TransactionEventName;
  transactionReference: string;
  transactionKind: TransactionKind;
  occurredAt: Date;
  payload: Readonly<Record<string, string>>;
}>;

export class InvalidTransactionEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionEventError";
  }
}

function assertNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidTransactionEventError(`${field} must not be empty`);
  }
  return normalized;
}

function freezeEvent(event: TransactionEvent): TransactionEvent {
  return Object.freeze({
    ...event,
    occurredAt: new Date(event.occurredAt),
    payload: Object.freeze({ ...event.payload }),
  });
}

export function transactionCreatedEvent(input: {
  id: string;
  transactionReference: string;
  transactionKind: TransactionKind;
  occurredAt: Date;
}): TransactionEvent {
  return freezeEvent({
    id: assertNonEmpty(input.id, "event id"),
    name: "TRANSACTION_CREATED",
    transactionReference: assertNonEmpty(
      input.transactionReference,
      "transaction reference",
    ).toUpperCase(),
    transactionKind: input.transactionKind,
    occurredAt: input.occurredAt,
    payload: Object.freeze({ state: "PENDING" }),
  });
}

export function transactionStateChangedEvent(input: {
  id: string;
  transactionReference: string;
  transactionKind: TransactionKind;
  from: TransactionState;
  to: TransactionState;
  occurredAt: Date;
}): TransactionEvent {
  if (input.from === input.to) {
    throw new InvalidTransactionEventError(
      "transaction state event requires two different states",
    );
  }

  return freezeEvent({
    id: assertNonEmpty(input.id, "event id"),
    name: "TRANSACTION_STATE_CHANGED",
    transactionReference: assertNonEmpty(
      input.transactionReference,
      "transaction reference",
    ).toUpperCase(),
    transactionKind: input.transactionKind,
    occurredAt: input.occurredAt,
    payload: Object.freeze({ from: input.from, to: input.to }),
  });
}
