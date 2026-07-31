import { Money } from "./money.js";

export type TransferCommandInput = Readonly<{
  transferId: string;
  sourceWalletId: string;
  destinationWalletId: string;
  amount: Money;
  idempotencyKey: string;
  reference?: string;
}>;

export class InvalidTransferCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransferCommandError";
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new InvalidTransferCommandError(`${field} must not be empty`);
  }
}

/**
 * Immutable and validated intent to move funds between two wallets.
 *
 * This value object deliberately contains no persistence or ledger mutation.
 * Application services must execute it atomically through the ledger and an
 * idempotency store.
 */
export class TransferCommand {
  private constructor(
    public readonly transferId: string,
    public readonly sourceWalletId: string,
    public readonly destinationWalletId: string,
    public readonly amount: Money,
    public readonly idempotencyKey: string,
    public readonly reference?: string,
  ) {}

  static create(input: TransferCommandInput): TransferCommand {
    assertNonEmpty(input.transferId, "transferId");
    assertNonEmpty(input.sourceWalletId, "sourceWalletId");
    assertNonEmpty(input.destinationWalletId, "destinationWalletId");
    assertNonEmpty(input.idempotencyKey, "idempotencyKey");

    if (input.sourceWalletId === input.destinationWalletId) {
      throw new InvalidTransferCommandError(
        "sourceWalletId and destinationWalletId must be different",
      );
    }

    if (!input.amount.isPositive()) {
      throw new InvalidTransferCommandError("amount must be strictly positive");
    }

    const reference = input.reference?.trim();
    if (reference !== undefined && reference.length === 0) {
      throw new InvalidTransferCommandError(
        "reference must not be blank when provided",
      );
    }

    return new TransferCommand(
      input.transferId.trim(),
      input.sourceWalletId.trim(),
      input.destinationWalletId.trim(),
      input.amount,
      input.idempotencyKey.trim(),
      reference,
    );
  }

  toJSON(): {
    transferId: string;
    sourceWalletId: string;
    destinationWalletId: string;
    amount: ReturnType<Money["toJSON"]>;
    idempotencyKey: string;
    reference?: string;
  } {
    return {
      transferId: this.transferId,
      sourceWalletId: this.sourceWalletId,
      destinationWalletId: this.destinationWalletId,
      amount: this.amount.toJSON(),
      idempotencyKey: this.idempotencyKey,
      ...(this.reference === undefined ? {} : { reference: this.reference }),
    };
  }
}
