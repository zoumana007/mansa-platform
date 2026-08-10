import { Injectable } from '@nestjs/common';
import type { ReconciliationMismatchReason } from '@mansa/contracts/reconciliation';

export interface ReconciliationImportOutcomeSummary {
  readonly matched: number;
  readonly mismatched: number;
  readonly byReason?: Readonly<Partial<Record<ReconciliationMismatchReason, number>>>;
}

export interface ReconciliationOperationalSnapshot {
  readonly importsStarted: number;
  readonly importsSucceeded: number;
  readonly importsFailed: number;
  readonly importedItems: number;
  readonly matchedItems: number;
  readonly mismatchedItems: number;
  readonly mismatchReasons: Readonly<Record<ReconciliationMismatchReason, number>>;
  readonly completedImportDurationMsTotal: number;
  readonly lastCompletedImportDurationMs: number | null;
  readonly lastImportStartedAt: string | null;
  readonly lastImportSucceededAt: string | null;
  readonly lastImportFailedAt: string | null;
}

const EMPTY_MISMATCH_REASONS: Record<ReconciliationMismatchReason, number> = {
  MISSING_INTERNAL_TRANSACTION: 0,
  MISSING_PROVIDER_TRANSACTION: 0,
  AMOUNT_MISMATCH: 0,
  CURRENCY_MISMATCH: 0,
  STATUS_MISMATCH: 0,
  DUPLICATE_PROVIDER_TRANSACTION: 0,
  OTHER: 0,
};

function requireDurationMs(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new Error('durationMs must be a finite non-negative number');
  }
  return durationMs;
}

function requireCount(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
  return value;
}

function validateOutcomeSummary(
  itemCount: number,
  outcome: ReconciliationImportOutcomeSummary | undefined,
): ReconciliationImportOutcomeSummary {
  if (outcome === undefined) {
    return { matched: 0, mismatched: 0, byReason: {} };
  }

  const matched = requireCount(outcome.matched, 'outcome.matched');
  const mismatched = requireCount(outcome.mismatched, 'outcome.mismatched');
  if (matched + mismatched !== itemCount) {
    throw new Error('outcome matched and mismatched counts must equal itemCount');
  }

  let reasonTotal = 0;
  for (const [reason, rawCount] of Object.entries(outcome.byReason ?? {})) {
    if (!(reason in EMPTY_MISMATCH_REASONS)) {
      throw new Error('outcome contains an unsupported mismatch reason');
    }
    reasonTotal += requireCount(rawCount, `outcome.byReason.${reason}`);
  }
  if (reasonTotal > mismatched) {
    throw new Error('mismatch reason counts cannot exceed outcome.mismatched');
  }

  return outcome;
}

@Injectable()
export class ReconciliationOperationalMonitor {
  private importsStarted = 0;
  private importsSucceeded = 0;
  private importsFailed = 0;
  private importedItems = 0;
  private matchedItems = 0;
  private mismatchedItems = 0;
  private readonly mismatchReasons: Record<ReconciliationMismatchReason, number> = {
    ...EMPTY_MISMATCH_REASONS,
  };
  private completedImportDurationMsTotal = 0;
  private lastCompletedImportDurationMs: number | null = null;
  private lastImportStartedAt: string | null = null;
  private lastImportSucceededAt: string | null = null;
  private lastImportFailedAt: string | null = null;

  public recordImportStarted(now = new Date()): void {
    this.importsStarted += 1;
    this.lastImportStartedAt = now.toISOString();
  }

  public recordImportSucceeded(
    itemCount: number,
    now = new Date(),
    durationMs = 0,
    outcome?: ReconciliationImportOutcomeSummary,
  ): void {
    requireCount(itemCount, 'itemCount');
    const validatedDurationMs = requireDurationMs(durationMs);
    const validatedOutcome = validateOutcomeSummary(itemCount, outcome);

    this.importsSucceeded += 1;
    this.importedItems += itemCount;
    this.matchedItems += validatedOutcome.matched;
    this.mismatchedItems += validatedOutcome.mismatched;
    for (const [reason, count] of Object.entries(validatedOutcome.byReason ?? {})) {
      this.mismatchReasons[reason as ReconciliationMismatchReason] += count;
    }
    this.completedImportDurationMsTotal += validatedDurationMs;
    this.lastCompletedImportDurationMs = validatedDurationMs;
    this.lastImportSucceededAt = now.toISOString();
  }

  public recordImportFailed(now = new Date(), durationMs = 0): void {
    const validatedDurationMs = requireDurationMs(durationMs);
    this.importsFailed += 1;
    this.completedImportDurationMsTotal += validatedDurationMs;
    this.lastCompletedImportDurationMs = validatedDurationMs;
    this.lastImportFailedAt = now.toISOString();
  }

  public snapshot(): ReconciliationOperationalSnapshot {
    return Object.freeze({
      importsStarted: this.importsStarted,
      importsSucceeded: this.importsSucceeded,
      importsFailed: this.importsFailed,
      importedItems: this.importedItems,
      matchedItems: this.matchedItems,
      mismatchedItems: this.mismatchedItems,
      mismatchReasons: Object.freeze({ ...this.mismatchReasons }),
      completedImportDurationMsTotal: this.completedImportDurationMsTotal,
      lastCompletedImportDurationMs: this.lastCompletedImportDurationMs,
      lastImportStartedAt: this.lastImportStartedAt,
      lastImportSucceededAt: this.lastImportSucceededAt,
      lastImportFailedAt: this.lastImportFailedAt,
    });
  }
}
