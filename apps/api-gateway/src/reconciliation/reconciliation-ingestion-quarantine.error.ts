import type { ReconciliationIngestionQuarantined } from './reconciliation-ingestion-boundary';

export class ReconciliationIngestionQuarantineError extends Error {
  public readonly code: ReconciliationIngestionQuarantined['code'];
  public readonly rowIndex?: number;
  public readonly sourceFingerprint: string;
  public readonly rowCount: number;

  public constructor(decision: ReconciliationIngestionQuarantined) {
    super(`reconciliation ingestion quarantined: ${decision.code}`);
    this.name = 'ReconciliationIngestionQuarantineError';
    this.code = decision.code;
    this.rowIndex = decision.rowIndex;
    this.sourceFingerprint = decision.sourceFingerprint;
    this.rowCount = decision.rowCount;
  }
}
