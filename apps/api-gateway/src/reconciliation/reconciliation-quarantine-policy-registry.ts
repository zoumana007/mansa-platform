export type ReconciliationQuarantineDataClassification =
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED';

export type ReconciliationQuarantinePolicyMode = 'SIGNALS_ONLY' | 'RAW_SOURCE';
export type ReconciliationQuarantineReplayStatus = 'DISABLED' | 'MANUAL_REVIEW';
export type ReconciliationQuarantinePolicyStatus = 'DRAFT' | 'APPROVED' | 'SUSPENDED';

export interface ReconciliationQuarantineProviderPolicy {
  readonly providerId: string;
  readonly classification: ReconciliationQuarantineDataClassification;
  readonly mode: ReconciliationQuarantinePolicyMode;
  readonly retentionDays: number | null;
  readonly encryptionAtRestRequired: boolean;
  readonly encryptionInTransitRequired: boolean;
  readonly allowedRoles: readonly string[];
  readonly replayStatus: ReconciliationQuarantineReplayStatus;
  readonly status: ReconciliationQuarantinePolicyStatus;
}

function freezePolicy(
  policy: ReconciliationQuarantineProviderPolicy,
): ReconciliationQuarantineProviderPolicy {
  return Object.freeze({
    ...policy,
    allowedRoles: Object.freeze([...policy.allowedRoles]),
  });
}

/**
 * Registre explicite et provider-neutral des décisions de quarantaine.
 *
 * Le registre ne stocke aucun secret et n'active aucun stockage à lui seul.
 * Un fournisseur sans politique enregistrée reste fail-closed. Le passage à
 * RAW_SOURCE exige une politique approuvée et complète, mais reste également
 * soumis à ReconciliationQuarantinePersistencePolicy avant toute persistance.
 */
export class ReconciliationQuarantinePolicyRegistry {
  private readonly policies = new Map<string, ReconciliationQuarantineProviderPolicy>();

  public register(policy: ReconciliationQuarantineProviderPolicy): void {
    const normalizedProviderId = policy.providerId.trim();

    if (!normalizedProviderId) {
      throw new Error('reconciliation quarantine policy providerId is required');
    }

    if (this.policies.has(normalizedProviderId)) {
      throw new Error(
        `reconciliation quarantine policy already registered for provider ${normalizedProviderId}`,
      );
    }

    this.assertPolicyIsCoherent({ ...policy, providerId: normalizedProviderId });
    this.policies.set(
      normalizedProviderId,
      freezePolicy({ ...policy, providerId: normalizedProviderId }),
    );
  }

  public resolve(providerId: string): ReconciliationQuarantineProviderPolicy {
    const normalizedProviderId = providerId.trim();
    const policy = this.policies.get(normalizedProviderId);

    if (!policy) {
      throw new Error(
        `no reconciliation quarantine policy registered for provider ${normalizedProviderId || '<empty>'}`,
      );
    }

    if (policy.status !== 'APPROVED') {
      throw new Error(
        `reconciliation quarantine policy is not approved for provider ${normalizedProviderId}`,
      );
    }

    return policy;
  }

  public has(providerId: string): boolean {
    return this.policies.has(providerId.trim());
  }

  private assertPolicyIsCoherent(policy: ReconciliationQuarantineProviderPolicy): void {
    if (policy.allowedRoles.some((role) => role.trim().length === 0)) {
      throw new Error('reconciliation quarantine policy contains an empty allowed role');
    }

    if (policy.mode === 'SIGNALS_ONLY') {
      if (policy.retentionDays !== null) {
        throw new Error('signals-only reconciliation quarantine policy must not define retentionDays');
      }
      if (policy.replayStatus !== 'DISABLED') {
        throw new Error('signals-only reconciliation quarantine policy must keep replay disabled');
      }
      return;
    }

    if (policy.status !== 'APPROVED') {
      throw new Error('raw reconciliation quarantine policy must be explicitly approved');
    }

    const retentionDays = policy.retentionDays;
    if (retentionDays === null || !Number.isInteger(retentionDays) || retentionDays <= 0) {
      throw new Error('raw reconciliation quarantine policy requires a positive retentionDays');
    }
    if (!policy.encryptionAtRestRequired || !policy.encryptionInTransitRequired) {
      throw new Error('raw reconciliation quarantine policy requires encryption at rest and in transit');
    }
    if (policy.allowedRoles.length === 0) {
      throw new Error('raw reconciliation quarantine policy requires at least one allowed role');
    }
  }
}
