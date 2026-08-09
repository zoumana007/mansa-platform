import { evaluateAccessDecision } from './access-decision-engine.js';
import type {
  AccessCredential,
  AccessDecision,
  AccessEntitlement,
  AccessRequest,
  AccessServiceAvailability,
  AccessTerminalProfile,
  RecordAccessUsageCommand,
} from './access-mobility.js';

export interface AccessApplicationRepository {
  resolveCredential(request: AccessRequest): Promise<AccessCredential | undefined>;
  resolveEntitlement(
    request: AccessRequest,
    credential: AccessCredential,
  ): Promise<AccessEntitlement | undefined>;
  loadServiceAvailability(request: AccessRequest): Promise<AccessServiceAvailability | undefined>;
  loadTerminalProfile(request: AccessRequest): Promise<AccessTerminalProfile | undefined>;
  countUsageInCurrentPeriod(
    request: AccessRequest,
    entitlement: AccessEntitlement,
  ): Promise<number>;
}

export interface AccessQuotaReservation {
  reserve(command: {
    readonly requestId: string;
    readonly organizationId: string;
    readonly entitlementId: string;
    readonly maxUsesPerPeriod: number;
    readonly period: NonNullable<AccessEntitlement['period']>;
    readonly occurredAt: string;
    readonly correlationId: string;
  }): Promise<boolean>;
}

export interface AccessDecisionJournal {
  recordDecision(decision: AccessDecision): Promise<void>;
  recordUsage(command: RecordAccessUsageCommand): Promise<void>;
}

export interface AccessApplicationDependencies {
  readonly repository: AccessApplicationRepository;
  readonly quota: AccessQuotaReservation;
  readonly journal: AccessDecisionJournal;
  readonly now?: () => string;
}

export interface ProcessAccessRequestResult {
  readonly decision: AccessDecision;
  readonly terminalProfile?: AccessTerminalProfile;
}

function assertTerminalScope(request: AccessRequest, terminal?: AccessTerminalProfile): void {
  if (terminal === undefined) return;
  if (terminal.organizationId !== request.organizationId || terminal.locationId !== request.locationId) {
    throw new Error('terminal profile does not belong to the request scope');
  }
  if (request.terminalId !== undefined && terminal.terminalId !== request.terminalId) {
    throw new Error('terminal profile does not match request terminalId');
  }
}

function usageCommand(request: AccessRequest, decision: AccessDecision): RecordAccessUsageCommand {
  return {
    requestId: request.requestId,
    decision: decision.decision,
    credentialId: decision.credentialId,
    subjectId: decision.subjectId,
    entitlementId: decision.entitlementId,
    locationId: request.locationId,
    terminalId: request.terminalId,
    chargedAmount: decision.approvedAmount,
    paymentMethod: request.paymentMethod,
    occurredAt: request.occurredAt,
    correlationId: request.correlationId,
  };
}

export async function processAccessRequest(
  request: AccessRequest,
  dependencies: AccessApplicationDependencies,
): Promise<ProcessAccessRequestResult> {
  const { repository, quota, journal } = dependencies;

  const [credential, service, terminalProfile] = await Promise.all([
    repository.resolveCredential(request),
    repository.loadServiceAvailability(request),
    repository.loadTerminalProfile(request),
  ]);

  assertTerminalScope(request, terminalProfile);

  const entitlement =
    credential === undefined ? undefined : await repository.resolveEntitlement(request, credential);

  const usageCountInPeriod =
    entitlement?.maxUsesPerPeriod === undefined
      ? undefined
      : await repository.countUsageInCurrentPeriod(request, entitlement);

  let decision = evaluateAccessDecision({
    request,
    credential,
    entitlement,
    service,
    usageCountInPeriod,
    decidedAt: dependencies.now?.(),
  });

  if (
    decision.decision === 'ALLOW' &&
    entitlement?.maxUsesPerPeriod !== undefined &&
    entitlement.period !== undefined
  ) {
    const reserved = await quota.reserve({
      requestId: request.requestId,
      organizationId: request.organizationId,
      entitlementId: entitlement.id,
      maxUsesPerPeriod: entitlement.maxUsesPerPeriod,
      period: entitlement.period,
      occurredAt: request.occurredAt,
      correlationId: request.correlationId,
    });

    if (!reserved) {
      decision = evaluateAccessDecision({
        request,
        credential,
        entitlement,
        service,
        usageCountInPeriod: entitlement.maxUsesPerPeriod,
        decidedAt: dependencies.now?.(),
      });
    }
  }

  await journal.recordDecision(decision);
  if (decision.decision === 'ALLOW') {
    await journal.recordUsage(usageCommand(request, decision));
  }

  return { decision, terminalProfile };
}
