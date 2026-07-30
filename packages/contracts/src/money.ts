export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface Money {
  readonly amountMinor: bigint;
  readonly currency: CurrencyCode;
}

export function createMoney(amountMinor: bigint, currency: CurrencyCode): Money {
  return Object.freeze({ amountMinor, currency });
}

export function assertSameCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) {
    throw new Error(`Currency mismatch: ${left.currency} !== ${right.currency}`);
  }
}

export function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return createMoney(left.amountMinor + right.amountMinor, left.currency);
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return createMoney(left.amountMinor - right.amountMinor, left.currency);
}

export function isNonNegativeMoney(value: Money): boolean {
  return value.amountMinor >= 0n;
}
