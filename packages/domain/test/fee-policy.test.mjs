import assert from "node:assert/strict";
import test from "node:test";

import { FeePolicy, Money, Rate } from "../dist/index.js";

test("FeePolicy combine frais fixes et taux variable", () => {
  const policy = FeePolicy.create({
    fixed: Money.ofMinor(100n, "XOF"),
    variable: Rate.ofBasisPoints(250n),
  });

  const fee = policy.calculate(Money.ofMinor(10_000n, "XOF"));

  assert.deepEqual(fee.toJSON(), { minor: "350", currency: "XOF" });
});

test("FeePolicy applique un minimum", () => {
  const policy = FeePolicy.create({
    fixed: Money.zero("XOF"),
    variable: Rate.ofBasisPoints(100n),
    minimum: Money.ofMinor(75n, "XOF"),
  });

  assert.equal(policy.calculate(Money.ofMinor(1_000n, "XOF")).minor, 75n);
});

test("FeePolicy applique un maximum", () => {
  const policy = FeePolicy.create({
    fixed: Money.ofMinor(100n, "XOF"),
    variable: Rate.ofBasisPoints(500n),
    maximum: Money.ofMinor(300n, "XOF"),
  });

  assert.equal(policy.calculate(Money.ofMinor(10_000n, "XOF")).minor, 300n);
});

test("FeePolicy refuse les devises incompatibles", () => {
  assert.throws(
    () =>
      FeePolicy.create({
        fixed: Money.ofMinor(100n, "XOF"),
        variable: Rate.zero(),
        minimum: Money.ofMinor(1n, "EUR"),
      }),
    /Currency mismatch/,
  );
});

test("FeePolicy refuse les bornes invalides", () => {
  assert.throws(
    () =>
      FeePolicy.create({
        fixed: Money.zero("XOF"),
        variable: Rate.zero(),
        minimum: Money.ofMinor(200n, "XOF"),
        maximum: Money.ofMinor(100n, "XOF"),
      }),
    /Minimum fee cannot exceed maximum fee/,
  );
});

test("FeePolicy refuse un montant de base négatif", () => {
  const policy = FeePolicy.create({
    fixed: Money.zero("XOF"),
    variable: Rate.ofBasisPoints(100n),
  });

  assert.throws(
    () => policy.calculate(Money.ofMinor(-1n, "XOF")),
    /Fee base amount cannot be negative/,
  );
});
