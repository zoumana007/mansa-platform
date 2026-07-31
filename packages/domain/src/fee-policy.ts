import { Money } from "./money.js";
import { Rate } from "./rate.js";

export type FeePolicyConfiguration = {
  fixed: Money;
  variable: Rate;
  minimum?: Money;
  maximum?: Money;
};

/**
 * Immutable fee policy combining a fixed amount and a variable rate.
 * Optional minimum and maximum caps are applied after the fee is computed.
 */
export class FeePolicy {
  private constructor(private readonly configuration: FeePolicyConfiguration) {
    const { fixed, minimum, maximum } = configuration;

    if (fixed.isNegative()) {
      throw new Error("Fixed fee cannot be negative");
    }

    this.assertOptionalCurrency(minimum, fixed);
    this.assertOptionalCurrency(maximum, fixed);

    if (minimum?.isNegative()) {
      throw new Error("Minimum fee cannot be negative");
    }

    if (maximum?.isNegative()) {
      throw new Error("Maximum fee cannot be negative");
    }

    if (minimum && maximum && minimum.minor > maximum.minor) {
      throw new Error("Minimum fee cannot exceed maximum fee");
    }
  }

  static create(configuration: FeePolicyConfiguration): FeePolicy {
    return new FeePolicy(configuration);
  }

  calculate(amount: Money): Money {
    if (amount.currency !== this.configuration.fixed.currency) {
      throw new Error(
        `Currency mismatch: ${amount.currency} cannot use a ${this.configuration.fixed.currency} fee policy`,
      );
    }

    if (amount.isNegative()) {
      throw new Error("Fee base amount cannot be negative");
    }

    const calculated = this.configuration.fixed.add(
      this.configuration.variable.applyTo(amount),
    );

    if (
      this.configuration.minimum &&
      calculated.minor < this.configuration.minimum.minor
    ) {
      return this.configuration.minimum;
    }

    if (
      this.configuration.maximum &&
      calculated.minor > this.configuration.maximum.minor
    ) {
      return this.configuration.maximum;
    }

    return calculated;
  }

  toJSON(): {
    fixed: ReturnType<Money["toJSON"]>;
    variable: ReturnType<Rate["toJSON"]>;
    minimum?: ReturnType<Money["toJSON"]>;
    maximum?: ReturnType<Money["toJSON"]>;
  } {
    return {
      fixed: this.configuration.fixed.toJSON(),
      variable: this.configuration.variable.toJSON(),
      ...(this.configuration.minimum
        ? { minimum: this.configuration.minimum.toJSON() }
        : {}),
      ...(this.configuration.maximum
        ? { maximum: this.configuration.maximum.toJSON() }
        : {}),
    };
  }

  private assertOptionalCurrency(value: Money | undefined, fixed: Money): void {
    if (value && value.currency !== fixed.currency) {
      throw new Error(
        `Currency mismatch: ${value.currency} cannot be combined with ${fixed.currency}`,
      );
    }
  }
}
