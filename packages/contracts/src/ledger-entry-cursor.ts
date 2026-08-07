export const LEDGER_ENTRY_CURSOR_VERSIONS = [1] as const;

export const LEDGER_ENTRY_CURSOR_VALIDATION_ERROR_CODES = [
  'UNSUPPORTED_VERSION',
  'INVALID_ACCOUNT_ID',
  'INVALID_POSTED_AT',
  'INVALID_ENTRY_ID',
] as const;

export type LedgerEntryCursorVersion =
  (typeof LEDGER_ENTRY_CURSOR_VERSIONS)[number];

export type LedgerEntryCursorValidationErrorCode =
  (typeof LEDGER_ENTRY_CURSOR_VALIDATION_ERROR_CODES)[number];

/**
 * Stable, storage-agnostic payload used to build opaque pagination cursors.
 *
 * The serialized representation must remain opaque to API consumers. Encoding,
 * signing and encryption are persistence/infrastructure concerns and are not
 * implemented in this contracts package.
 */
export interface LedgerEntryCursor {
  readonly version: LedgerEntryCursorVersion;
  readonly accountId: string;
  readonly postedAt: string;
  readonly entryId: string;
}

export interface LedgerEntryCursorValidationError {
  readonly code: LedgerEntryCursorValidationErrorCode;
  readonly message: string;
}

export interface LedgerEntryCursorValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerEntryCursorValidationError[];
}

export function validateLedgerEntryCursor(
  cursor: LedgerEntryCursor,
): LedgerEntryCursorValidationResult {
  const errors: LedgerEntryCursorValidationError[] = [];

  if (!LEDGER_ENTRY_CURSOR_VERSIONS.includes(cursor.version)) {
    errors.push({
      code: 'UNSUPPORTED_VERSION',
      message: 'Ledger entry cursor version is not supported.',
    });
  }

  if (cursor.accountId.trim().length === 0) {
    errors.push({
      code: 'INVALID_ACCOUNT_ID',
      message: 'Ledger entry cursor account id is required.',
    });
  }

  if (
    cursor.postedAt.trim().length === 0 ||
    Number.isNaN(Date.parse(cursor.postedAt))
  ) {
    errors.push({
      code: 'INVALID_POSTED_AT',
      message: 'Ledger entry cursor posted-at must be a valid date-time.',
    });
  }

  if (cursor.entryId.trim().length === 0) {
    errors.push({
      code: 'INVALID_ENTRY_ID',
      message: 'Ledger entry cursor entry id is required.',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function isLedgerEntryCursorValidationErrorCode(
  value: string,
): value is LedgerEntryCursorValidationErrorCode {
  return LEDGER_ENTRY_CURSOR_VALIDATION_ERROR_CODES.includes(
    value as LedgerEntryCursorValidationErrorCode,
  );
}
