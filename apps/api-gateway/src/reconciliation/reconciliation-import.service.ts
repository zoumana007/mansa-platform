import { Injectable } from '@nestjs/common';

import { ReconciliationRepository } from './reconciliation.repository';
import {
  TestReconciliationProviderAdapter,
  type InternalReconciliationRow,
  type ProviderReconciliationSource,
} from './reconciliation-provider.adapter';

@Injectable()
export class ReconciliationImportService {
  public constructor(
    private readonly repository: ReconciliationRepository,
    private readonly testProviderAdapter: TestReconciliationProviderAdapter,
  ) {}

  public async importTestProviderSource(
    organizationId: string,
    source: ProviderReconciliationSource,
    internalRows: readonly InternalReconciliationRow[],
  ) {
    const prepared = this.testProviderAdapter.prepare(source, internalRows);

    return this.repository.importBatch({
      organizationId,
      providerId: prepared.providerId,
      ...(prepared.sourceFileReference === undefined
        ? {}
        : { sourceFileReference: prepared.sourceFileReference }),
      sourceFingerprint: prepared.sourceFingerprint,
      periodStart: prepared.periodStart,
      periodEnd: prepared.periodEnd,
      metadata: { adapter: 'TEST_NORMALIZED_V1' },
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
  }
}
