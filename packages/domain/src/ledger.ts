export type LedgerSide = "DEBIT" | "CREDIT";

export interface LedgerLine {
  readonly accountId: string;
  readonly side: LedgerSide;
  readonly amountMinor: bigint;
  readonly currency: string;
}

export interface JournalEntryInput {
  readonly id: string;
  readonly transactionId: string;
  readonly idempotencyKey: string;
  readonly lines: readonly LedgerLine[];
  readonly createdAt: Date;
}

export class InvalidJournalEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJournalEntryError";
  }
}

export class JournalEntry {
  readonly id: string;
  readonly transactionId: string;
  readonly idempotencyKey: string;
  readonly lines: readonly LedgerLine[];
  readonly currency: string;
  readonly createdAt: Date;

  private constructor(input: JournalEntryInput, currency: string) {
    this.id = input.id;
    this.transactionId = input.transactionId;
    this.idempotencyKey = input.idempotencyKey;
    this.lines = Object.freeze([...input.lines]);
    this.currency = currency;
    this.createdAt = new Date(input.createdAt);
  }

  static create(input: JournalEntryInput): JournalEntry {
    if (!input.id.trim() || !input.transactionId.trim() || !input.idempotencyKey.trim()) {
      throw new InvalidJournalEntryError(
        "id, transactionId and idempotencyKey are required",
      );
    }

    if (input.lines.length < 2) {
      throw new InvalidJournalEntryError(
        "a journal entry requires at least two lines",
      );
    }

    const [firstLine] = input.lines;
    if (!firstLine) {
      throw new InvalidJournalEntryError("a journal entry requires lines");
    }

    const currency = normalizeCurrency(firstLine.currency);
    let debitTotal = 0n;
    let creditTotal = 0n;

    for (const line of input.lines) {
      if (!line.accountId.trim()) {
        throw new InvalidJournalEntryError("accountId is required");
      }
      if (line.amountMinor <= 0n) {
        throw new InvalidJournalEntryError("amountMinor must be positive");
      }
      if (normalizeCurrency(line.currency) !== currency) {
        throw new InvalidJournalEntryError(
          "all journal lines must use the same currency",
        );
      }

      if (line.side === "DEBIT") debitTotal += line.amountMinor;
      else creditTotal += line.amountMinor;
    }

    if (debitTotal !== creditTotal) {
      throw new InvalidJournalEntryError(
        "journal entry debits and credits must balance",
      );
    }

    return new JournalEntry(input, currency);
  }
}

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new InvalidJournalEntryError(
      "currency must be a three-letter ISO 4217 code",
    );
  }
  return normalized;
}
