export type CurrencyCode = string;

const ISO_CURRENCY_PATTERN = /^[A-Z]{3}$/;

function assertCurrency(currency: CurrencyCode): void {
  if (!ISO_CURRENCY_PATTERN.test(currency)) {
    throw new Error(`Invalid currency code: ${currency}`);
  }
}

/**
 * Immutable monetary value represented in minor units.
 *
 * Examples:
 * - 1 500 FCFA => Money.ofMinor(1500n, "XOF")
 * - 10,99 EUR => Money.ofMinor(1099n, "EUR")
 */
export class Money {
  private constructor(
    public readonly minor: bigint,
    public readonly currency: CurrencyCode,
  ) {
    assertCurrency(currency);
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(0n, currency);
  }

  static ofMinor(minor: bigint, currency: CurrencyCode): Money {
    return new Money(minor, currency);
  }

  static fromJSON(value: { minor: string; currency: CurrencyCode }): Money {
    if (!/^-?\d+$/.test(value.minor)) {
      throw new Error("Money minor value must be an integer string");
    }

    return new Money(BigInt(value.minor), value.currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor + other.minor, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor - other.minor, this.currency);
  }

  negate(): Money {
    return new Money(-this.minor, this.currency);
  }

  absolute(): Money {
    return this.minor < 0n ? this.negate() : this;
  }

  isZero(): boolean {
    return this.minor === 0n;
  }

  isPositive(): boolean {
    return this.minor > 0n;
  }

  isNegative(): boolean {
    return this.minor < 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minor === other.minor;
  }

  toJSON(): { minor: string; currency: CurrencyCode } {
    return {
      minor: this.minor.toString(),
      currency: this.currency,
    };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} cannot be combined with ${other.currency}`,
      );
    }
  }
}
