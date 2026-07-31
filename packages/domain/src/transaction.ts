import { Money } from "./money.js";
import {
  TransactionReference,
  type TransactionReferenceValue,
} from "./transaction-reference.js";
import {
  assertTransactionTransition,
  type TransactionState,
} from "./transaction-state.js";

export type TransactionKind =
  | "PAYMENT"
  | "TRANSFER"
  | "CASH_IN"
  | "CASH_OUT"
  | "REFUND";

export type TransactionSnapshot = Readonly<{
  reference: TransactionReferenceValue;
  kind: TransactionKind;
  amount: Money;
  state: TransactionState;
  createdAt: Date;
  updatedAt: Date;
}>;

export class InvalidTransactionAmountError extends Error {
  constructor(public readonly amount: Money) {
    super("transaction amount must be strictly positive");
    this.name = "InvalidTransactionAmountError";
  }
}

export class Transaction {
  private constructor(private snapshot: TransactionSnapshot) {}

  static create(input: {
    reference: TransactionReferenceValue;
    kind: TransactionKind;
    amount: Money;
    now?: Date;
  }): Transaction {
    TransactionReference.parse(input.reference);
    Transaction.assertPositiveAmount(input.amount);
    const now = input.now ?? new Date();

    return new Transaction({
      reference: input.reference,
      kind: input.kind,
      amount: input.amount,
      state: "PENDING",
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
  }

  static restore(snapshot: TransactionSnapshot): Transaction {
    TransactionReference.parse(snapshot.reference);
    Transaction.assertPositiveAmount(snapshot.amount);

    if (snapshot.updatedAt.getTime() < snapshot.createdAt.getTime()) {
      throw new Error("transaction updatedAt cannot precede createdAt");
    }

    return new Transaction({
      ...snapshot,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    });
  }

  transition(to: TransactionState, now: Date = new Date()): void {
    assertTransactionTransition(this.snapshot.state, to);

    if (now.getTime() < this.snapshot.updatedAt.getTime()) {
      throw new Error("transaction transition date cannot move backwards");
    }

    this.snapshot = {
      ...this.snapshot,
      state: to,
      updatedAt: new Date(now),
    };
  }

  current(): TransactionSnapshot {
    return Object.freeze({
      ...this.snapshot,
      createdAt: new Date(this.snapshot.createdAt),
      updatedAt: new Date(this.snapshot.updatedAt),
    });
  }

  private static assertPositiveAmount(amount: Money): void {
    if (!amount.isPositive()) {
      throw new InvalidTransactionAmountError(amount);
    }
  }
}
