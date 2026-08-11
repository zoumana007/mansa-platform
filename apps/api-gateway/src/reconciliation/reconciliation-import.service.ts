import { Injectable } from '@nestjs/common';
import { summarizeReconciliationComparisons } from '@mansa/contracts/reconciliation';
import { performance } from 'node:perf_hooks';

import { ReconciliationIngestionBoundary } from './reconciliation-ingestion-boundary';
import { ReconciliationIngestionQuarantineError } from './reconciliation-ingestion-quarantine.error';
import { ReconciliationOperationalMonitor } from './reconciliation-operational-monitor';
import { ReconciliationProviderRegistry } from './reconciliation-provider-registry';
import { ReconciliationRepository } from './reconciliation.repository';
import type {
  InternalReconciliationRow,
  ProviderReconciliationSource,
} from './reconciliation-provider.adapter';

@Injectable()
export class ReconciliationImportService {
  private readonly ingestionBoundary = new ReconciliationIngestionBoundary();

  public constructor(
    private readonly repository: ReconciliationRepository,
    private readonly providerRegistry: ReconciliationProviderRegistry,
    private readonly monitor: ReconciliationOperationalMonitor,
  ) {}

  public async importProviderSource(
    organizationId: string,
    source: ProviderReconciliationSource,
    internalRows: readonly InternalReconciliationRow[],
  ) {
    const startedMonotonicMs = performance.now();
    this.monitor.recordImportStarted();
    try {
      const ingestionDecision = this.ingestionBoundary.evaluate(source);
      if (!ingestionDecision.accepted) {
        this.monitor.recordImportQuarantined(ingestionDecision.code);
        throw new ReconciliationIngestionQuarantineError(ingestionDecision);
      }

      const adapter = this.providerRegistry.resolve(source.providerId);
      const prepared = adapter.prepare(source, internalRows);

      const result = await this.repository.importBatch({
        organizationId,
        providerId: prepared.providerId,
        ...(prepared.sourceFileReference === undefined
          ? {}
          : { sourceFileReference: prepared.sourceFileReference }),
        sourceFingerprint: prepared.sourceFingerprint,
        periodStart: prepared.periodStart,
        periodEnd: prepared.periodEnd,
        metadata: { adapter: adapter.adapterId },
        items: prepared.items.map(({ comparison, providerOccurrenceCount, rawLineFingerprint }) => ({
          ...(comparison.internalReference === undefined
            ? {}
            : { internalReference: comparison.internalReference }),
          ...(comparison.providerReference === undefined
            ? {}
            : { providerReference: comparison.providerReference }),
          ...(comparison.internalAmountMinor === undefined
            ? {}
            : { internalAmountMinor: BigInt(comparison.internalAmountMinor) }),
          ...(comparison.providerAmountMinor === undefined
            ? {}
            : { providerAmountMinor: BigInt(comparison.providerAmountMinor) }),
          currency: comparison.internalCurrency ?? comparison.providerCurrency ?? 'XXX',
          ...(comparison.internalStatus === undefined
            ? {}
            : { internalStatus: comparison.internalStatus }),
          ...(comparison.providerStatus === undefined
            ? {}
            : { providerStatus: comparison.providerStatus }),
          providerOccurrenceCount,
          status: comparison.status,
          ...(comparison.mismatchReason === undefined
            ? {}
            : { mismatchReason: comparison.mismatchReason }),
          rawLineFingerprint,
        })),
      });

      const summary = summarizeReconciliationComparisons(
        prepared.items.map(({ comparison }) => comparison),
      );
      this.monitor.recordImportSucceeded(
        summary.total,
        new Date(),
        performance.now() - startedMonotonicMs,
        {
          matched: summary.matched,
          mismatched: summary.mismatched,
          byReason: summary.byReason,
        },
      );
      return result;
    } catch (error) {
      this.monitor.recordImportFailed(new Date(), performance.now() - startedMonotonicMs);
      throw error;
    }
  }

  /**
   * Compatibilité transitoire pour les appels de pilote existants.
   * La résolution réelle de l'adaptateur passe désormais par le registre.
   */
  public async importTestProviderSource(
    organizationId: string,
    source: ProviderReconciliationSource,
    internalRows: readonly InternalReconciliationRow[],
  ) {
    return this.importProviderSource(organizationId, source, internalRows);
  }
}
