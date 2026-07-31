import { Money } from "./money.js";

export const INTERNAL_TRANSFER_STATUSES = [
  "CREATED",
  "PENDING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REVERSED",
] as const;

export type InternalTransferStatus =
  (typeof INTERNAL_TRANSFER_STATUSES)[number];

export type InternalTransferSnapshot = Readonly<{
  id: string;
  idempotencyKey: string;
  sourceWalletId: string;
  destinationWalletId: string;
  amount: Money;
  status: InternalTransferStatus;
  description?: string;
  clientReference?: string;
  failureCode?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}>;

const TRANSITIONS: Readonly<
  Record<InternalTransferStatus, readonly InternalTransferStatus[]>
> = {
  CREATED: ["PENDING", "CANCELLED"],
  PENDING: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: ["REVERSED"],
  FAILED: [],
  CANCELLED: [],
  REVERSED: [],
};

export class InvalidInternalTransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInternalTransferError";
  }
}

export class InvalidInternalTransferTransitionError extends Error {
  constructor(
    public readonly from: InternalTransferStatus,
    public readonly to: InternalTransferStatus,
  ) {
    super(`invalid internal transfer transition: ${from} -> ${to}`);
    this.name = "InvalidInternalTransferTransitionError";
  }
}

export class InternalTransfer {
  private constructor(private snapshot: InternalTransferSnapshot) {}

  static create(input: {
    id: string;
    idempotencyKey: string;
    sourceWalletId: string;
    destinationWalletId: string;
    amount: Money;
    description?: string;
    clientReference?: string;
    now: Date;
  }): InternalTransfer {
    if (!input.id.trim()) {
      throw new InvalidInternalTransferError("transfer id is required");
    }

    if (!input.idempotencyKey.trim()) {
      throw new InvalidInternalTransferError("idempotency key is required");
    }

    if (!input.sourceWalletId.trim() || !input.destinationWalletId.trim()) {
      throw new InvalidInternalTransferError("wallet identifiers are required");
    }

    if (input.sourceWalletId === input.destinationWalletId) {
      throw new InvalidInternalTransferError(
        "source and destination wallets must be different",
      );
    }

    if (!input.amount.isPositive()) {
      throw new InvalidInternalTransferError("transfer amount must be positive");
    }

    return new InternalTransfer({
      id: input.id,
      idempotencyKey: input.idempotencyKey,
      sourceWalletId: input.sourceWalletId,
      destinationWalletId: input.destinationWalletId,
      amount: input.amount,
      status: "CREATED",
      description: input.description,
      clientReference: input.clientReference,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(snapshot: InternalTransferSnapshot): InternalTransfer {
    return new InternalTransfer(snapshot);
  }

  current(): InternalTransferSnapshot {
    return this.snapshot;
  }

  transition(input: {
    to: InternalTransferStatus;
    now: Date;
    failureCode?: string;
  }): void {
    const from = this.snapshot.status;

    if (!TRANSITIONS[from].includes(input.to)) {
      throw new InvalidInternalTransferTransitionError(from, input.to);
    }

    if (input.to === "FAILED" && !input.failureCode?.trim()) {
      throw new InvalidInternalTransferError(
        "failure code is required for a failed transfer",
      );
    }

    this.snapshot = {
      ...this.snapshot,
      status: input.to,
      failureCode: input.to === "FAILED" ? input.failureCode : undefined,
      completedAt: input.to === "COMPLETED" ? input.now : this.snapshot.completedAt,
      updatedAt: input.now,
    };
  }
}
