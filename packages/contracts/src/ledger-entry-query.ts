import type { ListLedgerEntriesQuery } from './ledger-api.js';

export const LEDGER_ENTRY_QUERY_VALIDATION_ERROR_CODES = [
  'INVALID_ACCOUNT_ID',
  'INVALID_FROM',
  'INVALID_TO',
  'INVALID_DATE_RANGE',
  'INVALID_CURSOR',
  'INVALID_LIMIT',
] as const;

export type LedgerEntryQueryValidationErrorCode =
  (typeof LEDGER_ENTRY_QUERY_VALIDATION_ERROR_CODES)[number];

export interface LedgerEntryQueryValidationError {
  readonly code: LedgerEntryQueryValidationErrorCode;
  readonly message: string;
}

export interface LedgerEntryQueryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerEntryQueryValidationError[];
}

const isValidDateTime = (value: string): boolean =>
  value.trim().length > 0 && !Number.isNaN(Date.parse(value));

/**
 * Validates the public query used to list ledger entries.
 *
 * The contract deliberately keeps cursors opaque. Validation only guarantees
 * that a supplied cursor is non-empty; cursor decoding belongs to the storage
 * adapter that issued it.
 */
export function validateListLedgerEntriesQuery(
  query: ListLedgerEntriesQuery,
): LedgerEntryQueryValidationResult {
  const errors: LedgerEntryQueryValidationError[] = [];

  if (query.accountId.trim().length === 0) {
    errors.push({
      code: 'INVALID_ACCOUNT_ID',
      message: 'Ledger entry query account id is required.',
    });
  }

  const fromValid = query.from === undefined || isValidDateTime(query.from);
  const toValid = query.to === undefined || isValidDateTime(query.to);

  if (!fromValid) {
    errors.push({
      code: 'INVALID_FROM',
      message: 'Ledger entry query from must be a valid date-time.',
    });
  }

  if (!toValid) {
    errors.push({
      code: 'INVALID_TO',
      message: 'Ledger entry query to must be a valid date-time.',
    });
  }

  if (
    query.from !== undefined &&
    query.to !== undefined &&
    fromValid &&
    toValid &&
    Date.parse(query.from) > Date.parse(query.to)
  ) {
    errors.push({
      code: 'INVALID_DATE_RANGE',
      message: 'Ledger entry query from must be before or equal to to.',
    });
  }

  if (query.cursor !== undefined && query.cursor.trim().length === 0) {
    errors.push({
      code: 'INVALID_CURSOR',
      message: 'Ledger entry query cursor must not be empty when supplied.',
    });
  }

  if (
    query.limit !== undefined &&
    (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 200)
  ) {
    errors.push({
      code: 'INVALID_LIMIT',
      message: 'Ledger entry query limit must be an integer between 1 and 200.',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function isLedgerEntryQueryValidationErrorCode(
  value: string,
): value is LedgerEntryQueryValidationErrorCode {
  return LEDGER_ENTRY_QUERY_VALIDATION_ERROR_CODES.includes(
    value as LedgerEntryQueryValidationErrorCode,
  );
}
