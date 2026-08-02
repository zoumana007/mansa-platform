import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateTransactionLimits,
  type TransactionLimitPolicy,
  type TransactionLimitRequest,
} from "./limits.js";

const policy: TransactionLimitPolicy = {
  id: "ml-client-transfer-standard",
  version: "1.0",
  currency: "XOF",
  perTransactionMinor: 100_000n,
  dailyAmountMinor: 200_000n,
  dailyCount: 3,
  monthlyAmountMinor: 1_000_000n,
  monthlyCount: 10,
};

function request(overrides: Partial<TransactionLimitRequest> = {}): TransactionLimitRequest {
  return {
    amountMinor: 10_000n,
    currency: "XOF",
    currentDailyAmountMinor: 0n,
    currentDailyCount: 0,
    currentMonthlyAmountMinor: 0n,
    currentMonthlyCount: 0,
    ...overrides,
  };
}

test("autorise les valeurs exactement égales aux plafonds", () => {
  const result = evaluateTransactionLimits(
    request({
      amountMinor: 100_000n,
      currentDailyAmountMinor: 100_000n,
      currentDailyCount: 2,
      currentMonthlyAmountMinor: 900_000n,
      currentMonthlyCount: 9,
    }),
    policy,
  );

  assert.equal(result.decision, "ALLOW");
  assert.equal(result.projectedDailyAmountMinor, 200_000n);
  assert.equal(result.projectedDailyCount, 3);
  assert.equal(result.projectedMonthlyAmountMinor, 1_000_000n);
  assert.equal(result.projectedMonthlyCount, 10);
});

test("refuse le dépassement du montant unitaire en priorité", () => {
  const result = evaluateTransactionLimits(
    request({ amountMinor: 100_001n, currentDailyAmountMinor: 200_000n }),
    policy,
  );
  assert.equal(result.decision, "DENY_PER_TRANSACTION");
  assert.equal(result.exceededRule, "DENY_PER_TRANSACTION");
});

test("refuse le dépassement du cumul journalier", () => {
  const result = evaluateTransactionLimits(
    request({ amountMinor: 50_001n, currentDailyAmountMinor: 150_000n }),
    policy,
  );
  assert.equal(result.decision, "DENY_DAILY_AMOUNT");
});

test("refuse le dépassement du nombre journalier", () => {
  const result = evaluateTransactionLimits(request({ currentDailyCount: 3 }), policy);
  assert.equal(result.decision, "DENY_DAILY_COUNT");
});

test("refuse le dépassement du cumul mensuel", () => {
  const result = evaluateTransactionLimits(
    request({ amountMinor: 10_001n, currentMonthlyAmountMinor: 990_000n }),
    policy,
  );
  assert.equal(result.decision, "DENY_MONTHLY_AMOUNT");
});

test("refuse le dépassement du nombre mensuel", () => {
  const result = evaluateTransactionLimits(request({ currentMonthlyCount: 10 }), policy);
  assert.equal(result.decision, "DENY_MONTHLY_COUNT");
});

test("refuse une devise incohérente", () => {
  assert.throws(
    () => evaluateTransactionLimits(request({ currency: "EUR" }), policy),
    /request currency must match policy currency/,
  );
});

test("refuse les montants négatifs et compteurs non entiers", () => {
  assert.throws(
    () => evaluateTransactionLimits(request({ amountMinor: -1n }), policy),
    /amountMinor must be non-negative/,
  );
  assert.throws(
    () => evaluateTransactionLimits(request({ currentDailyCount: 1.5 }), policy),
    /currentDailyCount must be a non-negative safe integer/,
  );
});

test("refuse une politique invalide", () => {
  assert.throws(
    () => evaluateTransactionLimits(request(), { ...policy, dailyCount: -1 }),
    /policy.dailyCount must be a non-negative safe integer/,
  );
});
