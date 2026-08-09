import type {
  AccessCredential,
  AccessDecision,
  AccessDecisionReason,
  AccessEntitlement,
  AccessRequest,
  AccessServiceAvailability,
} from './access-mobility.js';

export interface AccessDecisionEvaluationContext {
  readonly request: AccessRequest;
  readonly credential?: AccessCredential;
  readonly entitlement?: AccessEntitlement;
  readonly service?: AccessServiceAvailability;
  readonly usageCountInPeriod?: number;
  readonly decidedAt?: string;
}

function decision(
  context: AccessDecisionEvaluationContext,
  value: AccessDecision['decision'],
  reason: AccessDecisionReason,
  extra: Partial<AccessDecision> = {},
): AccessDecision {
  return {
    requestId: context.request.requestId,
    decision: value,
    reason,
    correlationId: context.request.correlationId,
    decidedAt: context.decidedAt ?? context.request.occurredAt,
    ...extra,
  };
}

function outsideValidityWindow(entitlement: AccessEntitlement, occurredAt: string): boolean {
  const occurred = Date.parse(occurredAt);
  const validFrom = Date.parse(entitlement.validFrom);
  if (!Number.isFinite(occurred) || !Number.isFinite(validFrom)) {
    throw new Error('access decision timestamps must be valid ISO dates');
  }
  if (occurred < validFrom) return true;
  if (entitlement.validUntil !== undefined) {
    const validUntil = Date.parse(entitlement.validUntil);
    if (!Number.isFinite(validUntil)) {
      throw new Error('access entitlement validUntil must be a valid ISO date');
    }
    if (occurred > validUntil) return true;
  }
  return false;
}

export function evaluateAccessDecision(
  context: AccessDecisionEvaluationContext,
): AccessDecision {
  const { request, credential, entitlement, service } = context;

  if (!request.requestId.trim() || !request.correlationId.trim()) {
    throw new Error('requestId and correlationId are required');
  }

  if (service !== undefined) {
    if (service.organizationId !== request.organizationId || service.locationId !== request.locationId) {
      throw new Error('service availability does not belong to the request scope');
    }
    if (service.status === 'SUSPENDED' || service.status === 'MAINTENANCE') {
      return decision(context, 'DENY', 'SERVICE_SUSPENDED', {
        alternativeLocationId: service.alternativeLocationId,
        publicMessageKey: service.publicMessageKey,
        fallbackPaymentMethods: service.availablePaymentMethods,
      });
    }
    if (service.status === 'CLOSED' || service.status === 'DISABLED') {
      return decision(context, 'DENY', 'SERVICE_CLOSED', {
        alternativeLocationId: service.alternativeLocationId,
        publicMessageKey: service.publicMessageKey,
      });
    }
    if (
      request.paymentMethod !== undefined &&
      !service.availablePaymentMethods.includes(request.paymentMethod)
    ) {
      return decision(context, 'DENY', 'PAYMENT_METHOD_UNAVAILABLE', {
        fallbackPaymentMethods: service.availablePaymentMethods,
        publicMessageKey: service.publicMessageKey,
      });
    }
  }

  if (credential === undefined) return decision(context, 'DENY', 'CREDENTIAL_UNKNOWN');
  if (credential.organizationId !== request.organizationId) {
    return decision(context, 'DENY', 'CREDENTIAL_UNKNOWN');
  }
  if (credential.status !== 'ACTIVE') {
    return decision(context, 'DENY', 'CREDENTIAL_INACTIVE', { credentialId: credential.id });
  }

  if (entitlement === undefined) {
    return decision(context, 'DENY', 'ENTITLEMENT_MISSING', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
    });
  }
  if (
    entitlement.organizationId !== request.organizationId ||
    entitlement.subjectId !== credential.subjectId ||
    entitlement.useCase !== request.useCase
  ) {
    return decision(context, 'DENY', 'ENTITLEMENT_MISSING', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
    });
  }
  if (entitlement.status !== 'ACTIVE') {
    return decision(context, 'DENY', 'ENTITLEMENT_INACTIVE', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }
  if (outsideValidityWindow(entitlement, request.occurredAt)) {
    return decision(context, 'DENY', 'OUTSIDE_VALIDITY_WINDOW', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }
  if (
    entitlement.allowedLocationIds !== undefined &&
    !entitlement.allowedLocationIds.includes(request.locationId)
  ) {
    return decision(context, 'DENY', 'LOCATION_NOT_ALLOWED', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }
  if (
    request.productCode !== undefined &&
    entitlement.allowedProductCodes !== undefined &&
    !entitlement.allowedProductCodes.includes(request.productCode)
  ) {
    return decision(context, 'DENY', 'PRODUCT_NOT_ALLOWED', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }
  if (
    entitlement.maxUsesPerPeriod !== undefined &&
    (context.usageCountInPeriod ?? 0) >= entitlement.maxUsesPerPeriod
  ) {
    return decision(context, 'DENY', 'USAGE_LIMIT_REACHED', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }
  if (request.requestedAmount !== undefined && entitlement.amountLimit !== undefined) {
    if (
      request.requestedAmount.currency !== entitlement.amountLimit.currency ||
      request.requestedAmount.amountMinor > entitlement.amountLimit.amountMinor
    ) {
      return decision(context, 'DENY', 'AMOUNT_LIMIT_EXCEEDED', {
        credentialId: credential.id,
        subjectId: credential.subjectId,
        entitlementId: entitlement.id,
      });
    }
  }

  const matchPolicy = request.matchPolicy ?? service?.matchPolicy;
  if (matchPolicy === 'MANUAL_REVIEW') {
    return decision(context, 'REVIEW', 'MANUAL_REVIEW_REQUIRED', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }
  if (matchPolicy === 'CREDENTIAL_AND_PLATE_REQUIRED') {
    if (!request.observedLicensePlate) {
      return decision(context, 'DENY', 'PLATE_UNREADABLE', {
        credentialId: credential.id,
        subjectId: credential.subjectId,
        entitlementId: entitlement.id,
      });
    }
    const expectedPlate = credential.metadata?.licensePlate;
    if (expectedPlate !== undefined && expectedPlate !== request.observedLicensePlate) {
      return decision(context, 'DENY', 'PLATE_MISMATCH', {
        credentialId: credential.id,
        subjectId: credential.subjectId,
        entitlementId: entitlement.id,
      });
    }
  }
  if (
    matchPolicy === 'CREDENTIAL_VALID_PLATE_MISMATCH_DENY' &&
    credential.metadata?.licensePlate !== undefined &&
    request.observedLicensePlate !== undefined &&
    credential.metadata.licensePlate !== request.observedLicensePlate
  ) {
    return decision(context, 'DENY', 'PLATE_MISMATCH', {
      credentialId: credential.id,
      subjectId: credential.subjectId,
      entitlementId: entitlement.id,
    });
  }

  return decision(context, 'ALLOW', 'ENTITLEMENT_VALID', {
    credentialId: credential.id,
    subjectId: credential.subjectId,
    entitlementId: entitlement.id,
    ...(request.requestedAmount === undefined ? {} : { approvedAmount: request.requestedAmount }),
  });
}
