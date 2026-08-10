import { Injectable } from '@nestjs/common';

export interface ReconciliationOperationalSnapshot {
  readonly importsStarted: number;
  readonly importsSucceeded: number;
  readonly importsFailed: number;
  readonly importedItems: number;
  readonly completedImportDurationMsTotal: number;
  readonly lastCompletedImportDurationMs: number | null;
  readonly lastImportStartedAt: string | null;
  readonly lastImportSucceededAt: string | null;
  readonly lastImportFailedAt: string | null;
}

function requireDurationMs(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new Error('durationMs must be a finite non-negative number');
  }
  return durationMs;
}

@Injectable()
export class ReconciliationOperationalMonitor {
  private importsStarted = 0;
  private importsSucceeded = 0;
  private importsFailed = 0;
  private importedItems = 0;
  private completedImportDurationMsTotal = 0;
  private lastCompletedImportDurationMs: number | null = null;
  private lastImportStartedAt: string | null = null;
  private lastImportSucceededAt: string | null = null;
  private lastImportFailedAt: string | null = null;

  public recordImportStarted(now = new Date()): void {
    this.importsStarted += 1;
    this.lastImportStartedAt = now.toISOString();
  }

  public recordImportSucceeded(itemCount: number, now = new Date(), durationMs = 0): void {
    if (!Number.isSafeInteger(itemCount) || itemCount < 0) {
      throw new Error('itemCount must be a non-negative safe integer');
    }
    const validatedDurationMs = requireDurationMs(durationMs);
    this.importsSucceeded += 1;
    this.importedItems += itemCount;
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
      completedImportDurationMsTotal: this.completedImportDurationMsTotal,
      lastCompletedImportDurationMs: this.lastCompletedImportDurationMs,
      lastImportStartedAt: this.lastImportStartedAt,
      lastImportSucceededAt: this.lastImportSucceededAt,
      lastImportFailedAt: this.lastImportFailedAt,
    });
  }
}
