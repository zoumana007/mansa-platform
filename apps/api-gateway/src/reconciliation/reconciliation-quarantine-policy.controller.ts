import { Controller, Get, UseGuards } from '@nestjs/common';

import { WorkloadIdentityGuard } from '../workload-identity.guard';
import { RequireWorkloadScopes, WorkloadScopeGuard } from '../workload-scope.guard';
import { ReconciliationQuarantinePolicyRegistry } from './reconciliation-quarantine-policy-registry';

/**
 * Vue de contrôle interne des politiques de quarantaine configurées.
 *
 * Ces routes n'exposent que les métadonnées provider-neutral déjà présentes
 * dans le registre ou des agrégats à cardinalité bornée. Elles ne retournent
 * aucun payload fournisseur, secret, identifiant bancaire ou contenu de
 * quarantaine.
 */
@UseGuards(WorkloadIdentityGuard, WorkloadScopeGuard)
@Controller({ path: 'internal/reconciliation', version: '1' })
export class ReconciliationQuarantinePolicyController {
  public constructor(private readonly registry: ReconciliationQuarantinePolicyRegistry) {}

  @Get('quarantine-policies')
  @RequireWorkloadScopes('reconciliation:read')
  public listPolicies() {
    return { data: this.registry.snapshot() };
  }

  @Get('quarantine-policies/summary')
  @RequireWorkloadScopes('reconciliation:read')
  public summarizePolicies() {
    return { data: this.registry.summary() };
  }
}
