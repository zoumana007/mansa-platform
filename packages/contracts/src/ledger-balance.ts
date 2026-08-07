import type { LedgerBalance } from './ledger.js';

export const LEDGER_BALANCE_VALIDATION_ERROR_CODES = [
  'INVALID_ACCOUNT_ID',
  'CURRENCY_MISMATCH',
  'NEGATIVE_PENDING_AMOUNT',
  'INVALID_AS_OF',
] as const;

export type LedgerBalanceValidationErrorCode =
  (typeof LEDGER_BALANCE_VALIDATION_ERROR_CODES)[number];

export interface LedgerBalanceValidationError {
  readonly code: LedgerBalanceValidationErrorCode;
  readonly message: string;
}

export interface LedgerBalanceValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerBalanceValidationError[];
}

/**
 * Validates the structural invariants of a ledger balance projection.
 *
 * The available balance may legitimately be negative when a product permits
 * overdraft or deferred settlement. Pending funds, however, represent an
 * amount reserved or awaiting settlement and must never be negative.
 */
export function validateLedgerBalance(
  balance: LedgerBalance,
): LedgerBalanceValidationResult {
  const errors: LedgerBalanceValidationError[] = [];

  if (balance.accountId.trim().length === 0) {
    errors.push({
      code: 'INVALID_ACCOUNT_ID',
      message: 'Ledger balance account id is required.',
    });
  }

  if (balance.available.currency !== balance.pending.currency) {
    errors.push({
      code: 'CURRENCY_MISMATCH',
      message: 'Available and pending balances must use the same currency.',
    });
  }

  if (balance.pending.amountMinor < 0n) {
    errors.push({
      code: 'NEGATIVE_PENDING_AMOUNT',
      message: 'Pending ledger balance must not be negative.',
    });
  }

  if (Number.isNaN(Date.parse(balance.asOf))) {
    errors.push({
      code: 'INVALID_AS_OF',
      message: 'Ledger balance as-of must be a valid date-time.',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function isLedgerBalanceValidationErrorCode(
  value: string,
): value is LedgerBalanceValidationErrorCode {
  return LEDGER_BALANCE_VALIDATION_ERROR_CODES.includes(
    value as LedgerBalanceValidationErrorCode,
  );
}
