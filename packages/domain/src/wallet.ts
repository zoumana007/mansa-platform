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

export interface WalletSnapshot {
  id: string;
  ownerId: string;
  currency: CurrencyCode;
  availableBalanceMinor: bigint;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
}

function assertIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
}

function assertValidDate(value: Date, field: string): void {
  if (Number.isNaN(value.getTime())) {
    throw new Error(`${field} must be a valid date`);
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
    assertValidDate(createdAt, "Wallet creation date");

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

  /**
   * Rehydrates a wallet from a trusted persistence snapshot while rechecking
   * the aggregate invariants. Application code must use create() for new wallets.
   */
  static restore(snapshot: WalletSnapshot): Wallet {
    assertIdentifier(snapshot.id, "Wallet id");
    assertIdentifier(snapshot.ownerId, "Wallet owner id");

    const createdAt = new Date(snapshot.createdAt);
    const updatedAt = new Date(snapshot.updatedAt);
    assertValidDate(createdAt, "Wallet creation date");
    assertValidDate(updatedAt, "Wallet update date");

    if (updatedAt.getTime() < createdAt.getTime()) {
      throw new Error("Wallet update date cannot precede creation date");
    }

    const balance = Money.ofMinor(
      snapshot.availableBalanceMinor,
      snapshot.currency,
    );
    if (balance.isNegative()) {
      throw new Error("Wallet cannot be restored with a negative balance");
    }
    if (snapshot.status === "CLOSED" && !balance.isZero()) {
      throw new Error("A closed wallet must have a zero balance");
    }

    return new Wallet(
      snapshot.id,
      snapshot.ownerId,
      snapshot.currency,
      balance,
      snapshot.status,
      createdAt,
      updatedAt,
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

  toSnapshot(): WalletSnapshot {
    return {
      id: this.id,
      ownerId: this.ownerId,
      currency: this.currency,
      availableBalanceMinor: this.balance.minor,
      status: this.lifecycleStatus,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAtValue),
    };
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
    assertValidDate(nextUpdatedAt, "Wallet update date");
    if (nextUpdatedAt.getTime() < this.updatedAtValue.getTime()) {
      throw new Error("Wallet update date cannot move backwards");
    }
    this.updatedAtValue = nextUpdatedAt;
  }
}
