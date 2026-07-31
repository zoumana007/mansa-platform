export type IdempotencyDecision =
  | { readonly kind: "ACCEPT" }
  | { readonly kind: "REPLAY"; readonly responseReference: string }
  | { readonly kind: "CONFLICT" };

export interface IdempotencyRecord {
  readonly key: string;
  readonly requestHash: string;
  readonly responseReference?: string;
  readonly expiresAt: Date;
}

export class InvalidIdempotencyRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIdempotencyRecordError";
  }
}

export function decideIdempotency(
  key: string,
  requestHash: string,
  existing: IdempotencyRecord | undefined,
  now: Date,
): IdempotencyDecision {
  const normalizedKey = requireNonEmpty(key, "key");
  const normalizedHash = requireNonEmpty(requestHash, "requestHash");
  assertValidDate(now, "now");

  if (!existing) {
    return { kind: "ACCEPT" };
  }

  validateRecord(existing);

  if (existing.key !== normalizedKey || existing.expiresAt.getTime() <= now.getTime()) {
    return { kind: "ACCEPT" };
  }

  if (existing.requestHash !== normalizedHash) {
    return { kind: "CONFLICT" };
  }

  if (!existing.responseReference) {
    return { kind: "CONFLICT" };
  }

  return { kind: "REPLAY", responseReference: existing.responseReference };
}

export function createIdempotencyRecord(input: IdempotencyRecord): IdempotencyRecord {
  validateRecord(input);

  return Object.freeze({
    key: input.key.trim(),
    requestHash: input.requestHash.trim(),
    responseReference: input.responseReference?.trim() || undefined,
    expiresAt: new Date(input.expiresAt),
  });
}

function validateRecord(record: IdempotencyRecord): void {
  requireNonEmpty(record.key, "key");
  requireNonEmpty(record.requestHash, "requestHash");
  assertValidDate(record.expiresAt, "expiresAt");

  if (record.responseReference !== undefined && !record.responseReference.trim()) {
    throw new InvalidIdempotencyRecordError("responseReference must not be blank");
  }
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidIdempotencyRecordError(`${field} is required`);
  }
  return normalized;
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new InvalidIdempotencyRecordError(`${field} must be a valid date`);
  }
}
