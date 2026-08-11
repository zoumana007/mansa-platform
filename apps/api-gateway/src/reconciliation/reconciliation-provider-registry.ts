import { Injectable } from '@nestjs/common';

import type {
  InternalReconciliationRow,
  ProviderReconciliationSource,
  ReconciliationPreparedBatch,
} from './reconciliation-provider.adapter';

export interface ReconciliationProviderAdapter {
  readonly adapterId: string;
  supports(providerId: string): boolean;
  prepare(
    source: ProviderReconciliationSource,
    internalRows: readonly InternalReconciliationRow[],
  ): ReconciliationPreparedBatch;
}

@Injectable()
export class ReconciliationProviderRegistry {
  private readonly adapters = new Map<string, ReconciliationProviderAdapter>();

  public register(adapter: ReconciliationProviderAdapter): void {
    const adapterId = adapter.adapterId.trim();
    if (!adapterId) throw new Error('adapterId is required');
    if (this.adapters.has(adapterId)) {
      throw new Error(`reconciliation adapter already registered: ${adapterId}`);
    }
    this.adapters.set(adapterId, adapter);
  }

  public resolve(providerId: string): ReconciliationProviderAdapter {
    const normalizedProviderId = providerId.trim();
    if (!normalizedProviderId) throw new Error('providerId is required');

    const matches = [...this.adapters.values()].filter((adapter) =>
      adapter.supports(normalizedProviderId),
    );

    if (matches.length === 0) {
      throw new Error(`no reconciliation adapter registered for provider: ${normalizedProviderId}`);
    }
    if (matches.length > 1) {
      throw new Error(`multiple reconciliation adapters match provider: ${normalizedProviderId}`);
    }
    return matches[0];
  }

  public listAdapterIds(): readonly string[] {
    return [...this.adapters.keys()].sort();
  }
}
