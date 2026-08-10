import { Injectable } from '@nestjs/common';

export interface ReconciliationOperationalSnapshot {
  readonly importsStarted: number;
  readonly importsSucceeded: number;
  readonly importsFailed: number;
  readonly importedItems: number;
  readonly lastImportStartedAt: string | null;
  readonly lastImportSucceededAt: string | null;
  readonly lastImportFailedAt: string | null;
}

@Injectable()
export class ReconciliationOperationalMonitor {
  private importsStarted = 0;
  private importsSucceeded = 0;
  private importsFailed = 0;
  private importedItems = 0;
  private lastImportStartedAt: string | null = null;
  private lastImportSucceededAt: string | null = null;
  private lastImportFailedAt: string | null = null;

  public recordImportStarted(now = new Date()): void {
    this.importsStarted += 1;
    this.lastImportStartedAt = now.toISOString();
  }

  public recordImportSucceeded(itemCount: number, now = new Date()): void {
    if (!Number.isSafeInteger(itemCount) || itemCount < 0) {
      throw new Error('itemCount must be a non-negative safe integer');
    }
    this.importsSucceeded += 1;
    this.importedItems += itemCount;
    this.lastImportSucceededAt = now.toISOString();
  }

  public recordImportFailed(now = new Date()): void {
    this.importsFailed += 1;
    this.lastImportFailedAt = now.toISOString();
  }

  public snapshot(): ReconciliationOperationalSnapshot {
    return Object.freeze({
      importsStarted: this.importsStarted,
      importsSucceeded: this.importsSucceeded,
      importsFailed: this.importsFailed,
      importedItems: this.importedItems,
      lastImportStartedAt: this.lastImportStartedAt,
      lastImportSucceededAt: this.lastImportSucceededAt,
      lastImportFailedAt: this.lastImportFailedAt,
    });
  }
}
