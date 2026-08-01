import assert from "node:assert/strict";
import test from "node:test";

import { Money, TransactionLimitPolicy } from "../dist/index.js";

const xof = (minor) => Money.ofMinor(BigInt(minor), "XOF");

function policy() {
  return new TransactionLimitPolicy({
    currency: "XOF",
    perTransaction: xof(100_000),
    daily: xof(250_000),
    monthly: xof(1_000_000),
  });
}

test("autorise une opération égale à la limite par opération", () => {
  const decision = policy().evaluate({
    amount: xof(100_000),
    consumedToday: xof(0),
    consumedThisMonth: xof(0),
  });

  assert.equal(decision.allowed, true);
  assert.deepEqual(decision.dailyRemaining?.toJSON(), {
    minor: "150000",
    currency: "XOF",
  });
});

test("refuse une unité mineure au-dessus de la limite par opération", () => {
  const decision = policy().evaluate({
    amount: xof(100_001),
    consumedToday: xof(0),
    consumedThisMonth: xof(0),
  });

  assert.deepEqual(decision, {
    allowed: false,
    reason: "per_transaction_limit_exceeded",
    dailyRemaining: xof(250_000),
    monthlyRemaining: xof(1_000_000),
  });
});

test("refuse le dépassement de la limite journalière", () => {
  const decision = policy().evaluate({
    amount: xof(60_000),
    consumedToday: xof(200_000),
    consumedThisMonth: xof(500_000),
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "daily_limit_exceeded");
  assert.equal(decision.dailyRemaining?.minor, 50_000n);
});

test("refuse le dépassement de la limite mensuelle", () => {
  const decision = policy().evaluate({
    amount: xof(60_000),
    consumedToday: xof(10_000),
    consumedThisMonth: xof(950_000),
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "monthly_limit_exceeded");
  assert.equal(decision.monthlyRemaining?.minor, 50_000n);
});

test("refuse les montants nuls ou négatifs", () => {
  for (const amount of [xof(0), xof(-1)]) {
    const decision = policy().evaluate({
      amount,
      consumedToday: xof(0),
      consumedThisMonth: xof(0),
    });

    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "non_positive_amount");
  }
});

test("refuse une devise différente", () => {
  const decision = policy().evaluate({
    amount: Money.ofMinor(100n, "EUR"),
    consumedToday: xof(0),
    consumedThisMonth: xof(0),
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "currency_mismatch");
});

test("accepte une politique sans plafonds périodiques", () => {
  const decision = new TransactionLimitPolicy({ currency: "XOF" }).evaluate({
    amount: xof(5_000_000),
    consumedToday: xof(20_000_000),
    consumedThisMonth: xof(30_000_000),
  });

  assert.deepEqual(decision, {
    allowed: true,
    dailyRemaining: null,
    monthlyRemaining: null,
  });
});
