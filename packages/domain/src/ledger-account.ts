export const LEDGER_ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
] as const;

export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPES)[number];

export const LEDGER_ACCOUNT_STATUSES = ["ACTIVE", "FROZEN", "CLOSED"] as const;

export type LedgerAccountStatus = (typeof LEDGER_ACCOUNT_STATUSES)[number];

export interface LedgerAccountInput {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: LedgerAccountType;
  readonly currency: string;
  readonly status?: LedgerAccountStatus;
  readonly ownerReference?: string;
  readonly createdAt: Date;
}

export class InvalidLedgerAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLedgerAccountError";
  }
}

export class LedgerAccount {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: LedgerAccountType;
  readonly currency: string;
  readonly status: LedgerAccountStatus;
  readonly ownerReference?: string;
  readonly createdAt: Date;

  private constructor(input: LedgerAccountInput) {
    this.id = input.id.trim();
    this.code = input.code.trim().toUpperCase();
    this.name = input.name.trim();
    this.type = input.type;
    this.currency = normalizeCurrency(input.currency);
    this.status = input.status ?? "ACTIVE";
    this.ownerReference = input.ownerReference?.trim() || undefined;
    this.createdAt = new Date(input.createdAt);
  }

  static create(input: LedgerAccountInput): LedgerAccount {
    if (!input.id.trim()) {
      throw new InvalidLedgerAccountError("id is required");
    }
    if (!input.code.trim()) {
      throw new InvalidLedgerAccountError("code is required");
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9:_-]{1,79}$/.test(input.code.trim())) {
      throw new InvalidLedgerAccountError(
        "code must contain 2 to 80 alphanumeric, colon, underscore or hyphen characters",
      );
    }
    if (!input.name.trim()) {
      throw new InvalidLedgerAccountError("name is required");
    }
    if (!LEDGER_ACCOUNT_TYPES.includes(input.type)) {
      throw new InvalidLedgerAccountError("unsupported account type");
    }
    if (input.status && !LEDGER_ACCOUNT_STATUSES.includes(input.status)) {
      throw new InvalidLedgerAccountError("unsupported account status");
    }
    if (Number.isNaN(input.createdAt.getTime())) {
      throw new InvalidLedgerAccountError("createdAt must be a valid date");
    }

    return new LedgerAccount(input);
  }

  canPost(): boolean {
    return this.status === "ACTIVE";
  }
}

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new InvalidLedgerAccountError(
      "currency must be a three-letter ISO 4217 code",
    );
  }
  return normalized;
}
