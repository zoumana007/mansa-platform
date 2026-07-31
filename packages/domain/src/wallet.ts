import { CurrencyCode, Money } from "./money.js";

export type WalletStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface CreateWalletInput {
  id: string;
  ownerId: string;
  currency: CurrencyCode;
  status?: WalletStatus;
  availableBalance?: Money;
  createdAt?: Date;
}

function assertIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}

/**
 * Wallet aggregate responsible for balance and lifecycle invariants.
 *
 * The aggregate only models immediately available funds. Pending balances,
 * accounting entries and persistence are handled by dedicated domain services.
 */
export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly currency: CurrencyCode,
    private balance: Money,
    private lifecycleStatus: WalletStatus,
    public readonly createdAt: Date,
    private updatedAtValue: Date,
  ) {}

  static create(input: CreateWalletInput): Wallet {
    assertIdentifier(input.id, "Wallet id");
    assertIdentifier(input.ownerId, "Wallet owner id");

    const balance = input.availableBalance ?? Money.zero(input.currency);
    if (balance.currency !== input.currency) {
      throw new Error("Wallet balance currency must match wallet currency");
    }
    if (balance.isNegative()) {
      throw new Error("Wallet cannot be created with a negative balance");
    }

    const createdAt = new Date(input.createdAt ?? new Date());

    return new Wallet(
      input.id,
      input.ownerId,
      input.currency,
      balance,
      input.status ?? "ACTIVE",
      createdAt,
      new Date(createdAt),
    );
  }

  get availableBalance(): Money {
    return this.balance;
  }

  get status(): WalletStatus {
    return this.lifecycleStatus;
  }

  get updatedAt(): Date {
    return new Date(this.updatedAtValue);
  }

  credit(amount: Money, occurredAt: Date = new Date()): void {
    this.assertActive();
    this.assertCompatiblePositiveAmount(amount);
    this.balance = this.balance.add(amount);
    this.touch(occurredAt);
  }

  debit(amount: Money, occurredAt: Date = new Date()): void {
    this.assertActive();
    this.assertCompatiblePositiveAmount(amount);

    const nextBalance = this.balance.subtract(amount);
    if (nextBalance.isNegative()) {
      throw new Error("Insufficient available balance");
    }

    this.balance = nextBalance;
    this.touch(occurredAt);
  }

  suspend(occurredAt: Date = new Date()): void {
    if (this.lifecycleStatus === "CLOSED") {
      throw new Error("A closed wallet cannot be suspended");
    }
    if (this.lifecycleStatus !== "SUSPENDED") {
      this.lifecycleStatus = "SUSPENDED";
      this.touch(occurredAt);
    }
  }

  activate(occurredAt: Date = new Date()): void {
    if (this.lifecycleStatus === "CLOSED") {
      throw new Error("A closed wallet cannot be activated");
    }
    if (this.lifecycleStatus !== "ACTIVE") {
      this.lifecycleStatus = "ACTIVE";
      this.touch(occurredAt);
    }
  }

  close(occurredAt: Date = new Date()): void {
    if (!this.balance.isZero()) {
      throw new Error("Wallet balance must be zero before closing");
    }
    if (this.lifecycleStatus !== "CLOSED") {
      this.lifecycleStatus = "CLOSED";
      this.touch(occurredAt);
    }
  }

  private assertActive(): void {
    if (this.lifecycleStatus !== "ACTIVE") {
      throw new Error(`Wallet is not active: ${this.lifecycleStatus}`);
    }
  }

  private assertCompatiblePositiveAmount(amount: Money): void {
    if (amount.currency !== this.currency) {
      throw new Error("Wallet operation currency must match wallet currency");
    }
    if (!amount.isPositive()) {
      throw new Error("Wallet operation amount must be strictly positive");
    }
  }

  private touch(occurredAt: Date): void {
    const nextUpdatedAt = new Date(occurredAt);
    if (nextUpdatedAt.getTime() < this.updatedAtValue.getTime()) {
      throw new Error("Wallet update date cannot move backwards");
    }
    this.updatedAtValue = nextUpdatedAt;
  }
}
