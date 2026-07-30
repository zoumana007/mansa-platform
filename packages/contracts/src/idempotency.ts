const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;

export type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' };

export function parseIdempotencyKey(value: string): IdempotencyKey {
  if (!IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new Error(
      'Invalid idempotency key: expected 16 to 128 safe ASCII characters',
    );
  }

  return value as IdempotencyKey;
}

export function isIdempotencyKey(value: string): value is IdempotencyKey {
  return IDEMPOTENCY_KEY_PATTERN.test(value);
}
