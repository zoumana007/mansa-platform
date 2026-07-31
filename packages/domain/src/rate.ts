import { Money } from "./money.js";

const BASIS_POINTS_PER_UNIT = 10_000n;

/**
 * Immutable rate represented in basis points.
 *
 * Examples:
 * - 1 % = Rate.ofBasisPoints(100n)
 * - 2.5 % = Rate.ofBasisPoints(250n)
 */
export class Rate {
  private constructor(public readonly basisPoints: bigint) {
    if (basisPoints < 0n || basisPoints > BASIS_POINTS_PER_UNIT) {
      throw new Error("Rate basis points must be between 0 and 10000");
    }
  }

  static zero(): Rate {
    return new Rate(0n);
  }

  static ofBasisPoints(basisPoints: bigint): Rate {
    return new Rate(basisPoints);
  }

  static fromJSON(value: { basisPoints: string }): Rate {
    if (!/^\d+$/.test(value.basisPoints)) {
      throw new Error("Rate basis points must be an integer string");
    }

    return new Rate(BigInt(value.basisPoints));
  }

  applyTo(amount: Money): Money {
    const product = amount.minor * this.basisPoints;
    const rounded = this.roundHalfAwayFromZero(product, BASIS_POINTS_PER_UNIT);

    return Money.ofMinor(rounded, amount.currency);
  }

  complement(): Rate {
    return new Rate(BASIS_POINTS_PER_UNIT - this.basisPoints);
  }

  equals(other: Rate): boolean {
    return this.basisPoints === other.basisPoints;
  }

  toJSON(): { basisPoints: string } {
    return { basisPoints: this.basisPoints.toString() };
  }

  private roundHalfAwayFromZero(numerator: bigint, denominator: bigint): bigint {
    const sign = numerator < 0n ? -1n : 1n;
    const absolute = numerator < 0n ? -numerator : numerator;
    const quotient = absolute / denominator;
    const remainder = absolute % denominator;
    const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;

    return rounded * sign;
  }
}
