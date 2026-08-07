import type { LedgerEntryPage } from './ledger-api.js';

export const LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES = [
  'PAGE_TOO_LARGE',
  'EMPTY_NEXT_CURSOR',
  'DUPLICATE_ENTRY_ID',
  'INVALID_ENTRY_ID',
  'INVALID_TRANSACTION_ID',
  'INVALID_ACCOUNT_ID',
  'INVALID_SEQUENCE',
  'INVALID_POSTED_AT',
] as const;

export type LedgerEntryPageValidationErrorCode =
  (typeof LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES)[number];

export interface LedgerEntryPageValidationError {
  readonly code: LedgerEntryPageValidationErrorCode;
  readonly message: string;
  readonly entryIndex?: number;
}

export interface LedgerEntryPageValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerEntryPageValidationError[];
}

/**
 * Validates a page returned by the ledger listEntries contract.
 *
 * This is intentionally limited to pagination and stable identity fields.
 * Monetary and accounting invariants remain owned by the ledger domain
 * validators, while cursor decoding remains owned by the storage adapter.
 */
export function validateLedgerEntryPage(
  page: LedgerEntryPage,
): LedgerEntryPageValidationResult {
  const errors: LedgerEntryPageValidationError[] = [];

  if (page.items.length > 200) {
    errors.push({
      code: 'PAGE_TOO_LARGE',
      message: 'Ledger entry pages must contain at most 200 items.',
    });
  }

  if (page.nextCursor !== undefined && page.nextCursor.trim().length === 0) {
    errors.push({
      code: 'EMPTY_NEXT_CURSOR',
      message: 'Ledger entry next cursor must not be empty when supplied.',
    });
  }

  const seenEntryIds = new Set<string>();

  page.items.forEach((entry, entryIndex) => {
    if (entry.id.trim().length === 0) {
      errors.push({
        code: 'INVALID_ENTRY_ID',
        message: 'Ledger entry id is required.',
        entryIndex,
      });
    } else if (seenEntryIds.has(entry.id)) {
      errors.push({
        code: 'DUPLICATE_ENTRY_ID',
        message: 'Ledger entry ids must be unique inside a page.',
        entryIndex,
      });
    } else {
      seenEntryIds.add(entry.id);
    }

    if (entry.transactionId.trim().length === 0) {
      errors.push({
        code: 'INVALID_TRANSACTION_ID',
        message: 'Ledger entry transaction id is required.',
        entryIndex,
      });
    }

    if (entry.accountId.trim().length === 0) {
      errors.push({
        code: 'INVALID_ACCOUNT_ID',
        message: 'Ledger entry account id is required.',
        entryIndex,
      });
    }

    if (!Number.isInteger(entry.sequence) || entry.sequence < 1) {
      errors.push({
        code: 'INVALID_SEQUENCE',
        message: 'Ledger entry sequence must be a positive integer.',
        entryIndex,
      });
    }

    if (
      entry.postedAt.trim().length === 0 ||
      Number.isNaN(Date.parse(entry.postedAt))
    ) {
      errors.push({
        code: 'INVALID_POSTED_AT',
        message: 'Ledger entry posted-at must be a valid date-time.',
        entryIndex,
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

export function isLedgerEntryPageValidationErrorCode(
  value: string,
): value is LedgerEntryPageValidationErrorCode {
  return LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES.includes(
    value as LedgerEntryPageValidationErrorCode,
  );
}
