import type { LedgerAccountType } from "./ledger-account.js";
import type { LedgerLine } from "./ledger.js";

export interface LedgerBalance {
  readonly debitMinor: bigint;
  readonly creditMinor: bigint;
  readonly balanceMinor: bigint;
}

export class InvalidLedgerBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLedgerBalanceError";
  }
}

export function calculateLedgerBalance(
  accountId: string,
  accountType: LedgerAccountType,
  lines: readonly LedgerLine[],
): LedgerBalance {
  const normalizedAccountId = accountId.trim();
  if (!normalizedAccountId) {
    throw new InvalidLedgerBalanceError("accountId is required");
  }

  let debitMinor = 0n;
  let creditMinor = 0n;

  for (const line of lines) {
    if (line.accountId !== normalizedAccountId) continue;
    if (line.amountMinor <= 0n) {
      throw new InvalidLedgerBalanceError("amountMinor must be positive");
    }

    if (line.side === "DEBIT") debitMinor += line.amountMinor;
    else if (line.side === "CREDIT") creditMinor += line.amountMinor;
    else throw new InvalidLedgerBalanceError("unsupported ledger side");
  }

  const debitNormal = accountType === "ASSET" || accountType === "EXPENSE";
  const balanceMinor = debitNormal
    ? debitMinor - creditMinor
    : creditMinor - debitMinor;

  return Object.freeze({ debitMinor, creditMinor, balanceMinor });
}
