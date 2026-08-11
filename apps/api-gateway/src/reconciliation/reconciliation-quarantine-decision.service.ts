import { Injectable } from '@nestjs/common';

import { ReconciliationQuarantinePersistencePolicy } from './reconciliation-quarantine-persistence-policy';
import {
  ReconciliationQuarantinePolicyRegistry,
  type ReconciliationQuarantinePolicyMode,
} from './reconciliation-quarantine-policy-registry';

export type ReconciliationQuarantinePolicyResolution = 'APPROVED' | 'FALLBACK';

export interface ReconciliationQuarantineDecision {
  readonly providerId: string;
  readonly resolution: ReconciliationQuarantinePolicyResolution;
  readonly requestedMode: ReconciliationQuarantinePolicyMode;
  readonly effectiveMode: 'SIGNALS_ONLY';
  readonly rawSourcePersistenceAllowed: false;
  readonly manualReplayAllowed: false;
  readonly reason:
    | 'APPROVED_SIGNALS_ONLY'
    | 'APPROVED_RAW_SOURCE_NOT_TECHNICALLY_ENABLED'
    | 'NO_APPROVED_PROVIDER_POLICY';
}

/**
 * Relie le registre fournisseur à la garde globale de persistance.
 *
 * Cette tranche reste volontairement fail-closed : même lorsqu'une politique
 * fournisseur RAW_SOURCE est approuvée, le stockage brut reste interdit tant
 * que ReconciliationQuarantinePersistencePolicy ne l'autorise pas.
 */
@Injectable()
export class ReconciliationQuarantineDecisionService {
  private readonly persistencePolicy = new ReconciliationQuarantinePersistencePolicy();

  public constructor(
    private readonly policyRegistry: ReconciliationQuarantinePolicyRegistry,
  ) {}

  public evaluate(providerId: string): ReconciliationQuarantineDecision {
    const normalizedProviderId = providerId.trim();
    const fallback = (): ReconciliationQuarantineDecision =>
      Object.freeze({
        providerId: normalizedProviderId,
        resolution: 'FALLBACK',
        requestedMode: 'SIGNALS_ONLY',
        effectiveMode: 'SIGNALS_ONLY',
        rawSourcePersistenceAllowed: false,
        manualReplayAllowed: false,
        reason: 'NO_APPROVED_PROVIDER_POLICY',
      });

    if (!this.policyRegistry.has(normalizedProviderId)) {
      return fallback();
    }

    let policy;
    try {
      policy = this.policyRegistry.resolve(normalizedProviderId);
    } catch {
      return fallback();
    }

    const persistencePlan = this.persistencePolicy.plan();

    if (policy.mode === 'RAW_SOURCE') {
      return Object.freeze({
        providerId: normalizedProviderId,
        resolution: 'APPROVED',
        requestedMode: 'RAW_SOURCE',
        effectiveMode: persistencePlan.mode,
        rawSourcePersistenceAllowed: false,
        manualReplayAllowed: false,
        reason: 'APPROVED_RAW_SOURCE_NOT_TECHNICALLY_ENABLED',
      });
    }

    return Object.freeze({
      providerId: normalizedProviderId,
      resolution: 'APPROVED',
      requestedMode: 'SIGNALS_ONLY',
      effectiveMode: persistencePlan.mode,
      rawSourcePersistenceAllowed: false,
      manualReplayAllowed: false,
      reason: 'APPROVED_SIGNALS_ONLY',
    });
  }
}
