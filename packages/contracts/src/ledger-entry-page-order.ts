import type { LedgerEntryPage } from './ledger-api.js';
import { compareLedgerEntryPositions } from './ledger-entry-keyset.js';

export const LEDGER_ENTRY_PAGE_ORDER_ERROR_CODES = [
  'OUT_OF_ORDER',
] as const;

export type LedgerEntryPageOrderErrorCode =
  (typeof LEDGER_ENTRY_PAGE_ORDER_ERROR_CODES)[number];

export interface LedgerEntryPageOrderError {
  readonly code: LedgerEntryPageOrderErrorCode;
  readonly message: string;
  readonly entryIndex: number;
}

export interface LedgerEntryPageOrderValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerEntryPageOrderError[];
}

/**
 * Verifies that a page respects the canonical ledger keyset order:
 * postedAt ASC, then entry id ASC.
 *
 * Identity, timestamp and page-shape validation remain owned by
 * validateLedgerEntryPage. This validator only checks relative ordering.
 */
export function validateLedgerEntryPageOrder(
  page: LedgerEntryPage,
): LedgerEntryPageOrderValidationResult {
  const errors: LedgerEntryPageOrderError[] = [];

  for (let index = 1; index < page.items.length; index += 1) {
    const previous = page.items[index - 1];
    const current = page.items[index];

    if (previous === undefined || current === undefined) continue;

    const comparison = compareLedgerEntryPositions(
      { postedAt: previous.postedAt, entryId: previous.id },
      { postedAt: current.postedAt, entryId: current.id },
    );

    if (comparison >= 0) {
      errors.push({
        code: 'OUT_OF_ORDER',
        message:
          'Ledger entry page items must be strictly ordered by postedAt ASC then entry id ASC.',
        entryIndex: index,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isLedgerEntryPageOrderErrorCode(
  value: string,
): value is LedgerEntryPageOrderErrorCode {
  return LEDGER_ENTRY_PAGE_ORDER_ERROR_CODES.includes(
    value as LedgerEntryPageOrderErrorCode,
  );
}
