export interface NormalizedLedgerReversalRequest {
  readonly reasonCode: string;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface LedgerReversalValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly value?: NormalizedLedgerReversalRequest;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

export const validateLedgerReversalRequest = (
  body: unknown,
): LedgerReversalValidationResult => {
  if (!isRecord(body)) {
    return { valid: false, errors: ['body must be an object.'] };
  }

  const errors: string[] = [];
  if (!isNonEmptyString(body.reasonCode, 64)) {
    errors.push('reasonCode must be a non-empty string of at most 64 characters.');
  }
  if (!isNonEmptyString(body.reason, 256)) {
    errors.push('reason must be a non-empty string of at most 256 characters.');
  }
  if (!isNonEmptyString(body.idempotencyKey, 128)) {
    errors.push('idempotencyKey must be a non-empty string of at most 128 characters.');
  }
  if (!isNonEmptyString(body.correlationId, 128)) {
    errors.push('correlationId must be a non-empty string of at most 128 characters.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    value: {
      reasonCode: (body.reasonCode as string).trim(),
      reason: (body.reason as string).trim(),
      idempotencyKey: (body.idempotencyKey as string).trim(),
      correlationId: (body.correlationId as string).trim(),
    },
  };
};
