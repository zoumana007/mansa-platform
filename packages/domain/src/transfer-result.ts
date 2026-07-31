export type TransferResultStatus = "COMPLETED" | "REPLAYED";

export type TransferResultInput = Readonly<{
  transferId: string;
  transactionId: string;
  status: TransferResultStatus;
  completedAt: Date;
}>;

export class InvalidTransferResultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransferResultError";
  }
}

/**
 * Stable response returned after executing a transfer command.
 *
 * The same transfer and idempotency key must resolve to the same transaction
 * reference. `REPLAYED` explicitly signals that no new ledger mutation was
 * performed for the current request.
 */
export class TransferResult {
  private constructor(
    public readonly transferId: string,
    public readonly transactionId: string,
    public readonly status: TransferResultStatus,
    public readonly completedAt: Date,
  ) {}

  static create(input: TransferResultInput): TransferResult {
    const transferId = requireNonEmpty(input.transferId, "transferId");
    const transactionId = requireNonEmpty(input.transactionId, "transactionId");

    if (input.status !== "COMPLETED" && input.status !== "REPLAYED") {
      throw new InvalidTransferResultError(
        "status must be COMPLETED or REPLAYED",
      );
    }

    if (!(input.completedAt instanceof Date) || Number.isNaN(input.completedAt.getTime())) {
      throw new InvalidTransferResultError("completedAt must be a valid date");
    }

    return new TransferResult(
      transferId,
      transactionId,
      input.status,
      new Date(input.completedAt),
    );
  }

  static completed(
    transferId: string,
    transactionId: string,
    completedAt: Date,
  ): TransferResult {
    return TransferResult.create({
      transferId,
      transactionId,
      status: "COMPLETED",
      completedAt,
    });
  }

  static replayed(
    transferId: string,
    transactionId: string,
    completedAt: Date,
  ): TransferResult {
    return TransferResult.create({
      transferId,
      transactionId,
      status: "REPLAYED",
      completedAt,
    });
  }

  toJSON(): {
    transferId: string;
    transactionId: string;
    status: TransferResultStatus;
    completedAt: string;
  } {
    return {
      transferId: this.transferId,
      transactionId: this.transactionId,
      status: this.status,
      completedAt: this.completedAt.toISOString(),
    };
  }
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidTransferResultError(`${field} must not be empty`);
  }
  return normalized;
}
