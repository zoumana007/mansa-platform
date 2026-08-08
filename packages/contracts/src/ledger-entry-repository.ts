import type { LedgerEntry } from './ledger.js';
import type { LedgerEntryPosition } from './ledger-entry-keyset.js';

export const LEDGER_ENTRY_REPOSITORY_QUERY_ERROR_CODES = [
  'INVALID_ACCOUNT_ID',
  'INVALID_FROM',
  'INVALID_TO',
  'INVALID_DATE_RANGE',
  'INVALID_AFTER',
  'INVALID_TAKE',
] as const;

export type LedgerEntryRepositoryQueryErrorCode =
  (typeof LEDGER_ENTRY_REPOSITORY_QUERY_ERROR_CODES)[number];

/**
 * Storage-facing query for deterministic ledger-entry keyset pagination.
 *
 * `after` is already decoded and validated by the application/API adapter.
 * Implementations must use the canonical order `(postedAt ASC, entryId ASC)`
 * and return at most `take` rows. Callers normally request `limit + 1` rows so
 * they can determine whether another page exists without issuing a count.
 */
export interface LedgerEntryRepositoryQuery {
  readonly accountId: string;
  readonly from?: string;
  readonly to?: string;
  readonly after?: LedgerEntryPosition;
  readonly take: number;
}

export interface LedgerEntryRepositoryQueryError {
  readonly code: LedgerEntryRepositoryQueryErrorCode;
  readonly message: string;
}

export interface LedgerEntryRepositoryQueryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerEntryRepositoryQueryError[];
}

/**
 * Persistence port implemented by PostgreSQL/Prisma (or another storage
 * technology). The contract intentionally contains no Prisma types so the
 * ledger domain remains storage-agnostic.
 */
export interface LedgerEntryRepository {
  readonly listEntries: (
    query: LedgerEntryRepositoryQuery,
  ) => Promise<readonly LedgerEntry[]>;
}

const isValidDateTime = (value: string): boolean =>
  value.trim().length > 0 && !Number.isNaN(Date.parse(value));

export function validateLedgerEntryRepositoryQuery(
  query: LedgerEntryRepositoryQuery,
): LedgerEntryRepositoryQueryValidationResult {
  const errors: LedgerEntryRepositoryQueryError[] = [];

  if (query.accountId.trim().length === 0) {
    errors.push({
      code: 'INVALID_ACCOUNT_ID',
      message: 'Ledger entry repository account id is required.',
    });
  }

  const fromValid = query.from === undefined || isValidDateTime(query.from);
  const toValid = query.to === undefined || isValidDateTime(query.to);

  if (!fromValid) {
    errors.push({
      code: 'INVALID_FROM',
      message: 'Ledger entry repository from must be a valid date-time.',
    });
  }

  if (!toValid) {
    errors.push({
      code: 'INVALID_TO',
      message: 'Ledger entry repository to must be a valid date-time.',
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
      message: 'Ledger entry repository from must be before or equal to to.',
    });
  }

  if (query.after !== undefined) {
    if (!isValidDateTime(query.after.postedAt) || query.after.entryId.trim().length === 0) {
      errors.push({
        code: 'INVALID_AFTER',
        message: 'Ledger entry repository keyset position is invalid.',
      });
    }
  }

  if (!Number.isInteger(query.take) || query.take < 1 || query.take > 201) {
    errors.push({
      code: 'INVALID_TAKE',
      message: 'Ledger entry repository take must be an integer between 1 and 201.',
    });
  }

  return { valid: errors.length === 0, errors };
}

export function isLedgerEntryRepositoryQueryErrorCode(
  value: string,
): value is LedgerEntryRepositoryQueryErrorCode {
  return LEDGER_ENTRY_REPOSITORY_QUERY_ERROR_CODES.includes(
    value as LedgerEntryRepositoryQueryErrorCode,
  );
}
