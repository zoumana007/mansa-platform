export type ReconciliationQuarantinePersistenceMode = 'SIGNALS_ONLY' | 'RAW_SOURCE';

export interface ReconciliationQuarantinePersistencePlan {
  readonly mode: 'SIGNALS_ONLY';
  readonly persistRawSource: false;
  readonly persistProviderPayload: false;
  readonly manualReplayAllowed: false;
  readonly durableMetadataAllowed: false;
}

/**
 * Garde de sécurité pour la quarantaine d'ingestion du rapprochement.
 *
 * Tant que la politique de rétention, chiffrement, contrôle d'accès,
 * suppression vérifiable et reprise manuelle n'est pas explicitement
 * approuvée, la plateforme ne doit conserver que les signaux bornés déjà
 * exposés par l'observabilité. Aucun payload fournisseur rejeté ne doit être
 * persisté par ce composant.
 */
export class ReconciliationQuarantinePersistencePolicy {
  public constructor(mode: ReconciliationQuarantinePersistenceMode = 'SIGNALS_ONLY') {
    if (mode !== 'SIGNALS_ONLY') {
      throw new Error(
        'raw reconciliation quarantine persistence is not approved; define retention, encryption, access audit, deletion verification and replay controls first',
      );
    }
  }

  public plan(): ReconciliationQuarantinePersistencePlan {
    return Object.freeze({
      mode: 'SIGNALS_ONLY',
      persistRawSource: false,
      persistProviderPayload: false,
      manualReplayAllowed: false,
      durableMetadataAllowed: false,
    });
  }

  public assertRawSourcePersistenceAllowed(): never {
    throw new Error(
      'raw reconciliation quarantine persistence is disabled by policy',
    );
  }
}
