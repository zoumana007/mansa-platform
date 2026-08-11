export type ReconciliationQuarantineDataClassification =
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED';

export type ReconciliationQuarantinePolicyMode = 'SIGNALS_ONLY' | 'RAW_SOURCE';
export type ReconciliationQuarantineReplayStatus = 'DISABLED' | 'MANUAL_REVIEW';
export type ReconciliationQuarantinePolicyStatus = 'DRAFT' | 'APPROVED' | 'SUSPENDED';
export type ReconciliationQuarantineConfigurationHealthStatus =
  | 'EMPTY'
  | 'NOT_READY'
  | 'READY';

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

export interface ReconciliationQuarantinePolicySummary {
  readonly total: number;
  readonly byStatus: Readonly<Record<ReconciliationQuarantinePolicyStatus, number>>;
  readonly byMode: Readonly<Record<ReconciliationQuarantinePolicyMode, number>>;
}

export interface ReconciliationQuarantineConfigurationHealth {
  readonly status: ReconciliationQuarantineConfigurationHealthStatus;
  readonly configured: boolean;
  readonly ready: boolean;
  readonly policyCount: number;
  readonly approvedPolicyCount: number;
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

  /**
   * Retourne un inventaire en lecture seule, stable et indépendant de l'ordre
   * d'enregistrement. Le snapshot contient uniquement les métadonnées de
   * politique déjà présentes dans le registre : aucun payload fournisseur ni
   * secret opérationnel n'est ajouté par cette vue.
   */
  public snapshot(): readonly ReconciliationQuarantineProviderPolicy[] {
    return Object.freeze(
      [...this.policies.values()]
        .sort((left, right) => left.providerId.localeCompare(right.providerId))
        .map((policy) => freezePolicy(policy)),
    );
  }

  /**
   * Produit un résumé à cardinalité bornée pour la supervision interne.
   * Aucun providerId ni autre identifiant fournisseur n'est exposé : seuls le
   * total global et les compteurs sur les enums bornées status/mode sortent du
   * registre.
   */
  public summary(): ReconciliationQuarantinePolicySummary {
    const byStatus: Record<ReconciliationQuarantinePolicyStatus, number> = {
      DRAFT: 0,
      APPROVED: 0,
      SUSPENDED: 0,
    };
    const byMode: Record<ReconciliationQuarantinePolicyMode, number> = {
      SIGNALS_ONLY: 0,
      RAW_SOURCE: 0,
    };

    for (const policy of this.policies.values()) {
      byStatus[policy.status] += 1;
      byMode[policy.mode] += 1;
    }

    return Object.freeze({
      total: this.policies.size,
      byStatus: Object.freeze({ ...byStatus }),
      byMode: Object.freeze({ ...byMode }),
    });
  }

  /**
   * Expose uniquement un état de configuration à faible cardinalité.
   *
   * EMPTY distingue l'absence totale de politique. NOT_READY signale qu'une
   * configuration existe mais qu'aucune politique n'est approuvée, donc qu'un
   * chemin métier qui exige resolve() resterait fail-closed. READY signifie
   * qu'au moins une politique approuvée est disponible. Aucun providerId,
   * rôle, paramètre de rétention ou détail de classification n'est exposé.
   */
  public health(): ReconciliationQuarantineConfigurationHealth {
    const policyCount = this.policies.size;
    let approvedPolicyCount = 0;

    for (const policy of this.policies.values()) {
      if (policy.status === 'APPROVED') {
        approvedPolicyCount += 1;
      }
    }

    const status: ReconciliationQuarantineConfigurationHealthStatus =
      policyCount === 0 ? 'EMPTY' : approvedPolicyCount === 0 ? 'NOT_READY' : 'READY';

    return Object.freeze({
      status,
      configured: policyCount > 0,
      ready: approvedPolicyCount > 0,
      policyCount,
      approvedPolicyCount,
    });
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
