import assert from "node:assert/strict";
import test from "node:test";

import { evaluateVelocity } from "./velocity.js";

const transferRules = [
  {
    id: "transfer-minute-count",
    operation: "TRANSFER" as const,
    window: "MINUTE" as const,
    maxCount: 3,
    enabled: true,
  },
  {
    id: "transfer-day-amount",
    operation: "TRANSFER" as const,
    window: "DAY" as const,
    maxAmountMinor: 500_000n,
    enabled: true,
  },
];

test("autorise lorsque les seuils ne sont pas atteints", () => {
  assert.deepEqual(
    evaluateVelocity(
      [
        {
          operation: "TRANSFER",
          window: "MINUTE",
          count: 2,
          amountMinor: 20_000n,
        },
        {
          operation: "TRANSFER",
          window: "DAY",
          count: 5,
          amountMinor: 400_000n,
        },
      ],
      transferRules,
    ),
    {
      allowed: true,
      reason: "VELOCITY_ALLOWED",
      matchedRuleIds: ["transfer-minute-count", "transfer-day-amount"],
    },
  );
});

test("bloque lorsque le nombre maximal est atteint", () => {
  assert.deepEqual(
    evaluateVelocity(
      [
        {
          operation: "TRANSFER",
          window: "MINUTE",
          count: 3,
        },
      ],
      transferRules,
    ),
    {
      allowed: false,
      reason: "COUNT_LIMIT_EXCEEDED",
      ruleId: "transfer-minute-count",
    },
  );
});

test("bloque lorsque le montant maximal est atteint", () => {
  assert.deepEqual(
    evaluateVelocity(
      [
        {
          operation: "TRANSFER",
          window: "DAY",
          count: 1,
          amountMinor: 500_000n,
        },
      ],
      transferRules,
    ),
    {
      allowed: false,
      reason: "AMOUNT_LIMIT_EXCEEDED",
      ruleId: "transfer-day-amount",
    },
  );
});

test("ignore les règles désactivées ou sans compteur correspondant", () => {
  assert.deepEqual(
    evaluateVelocity(
      [{ operation: "LOGIN", window: "HOUR", count: 50 }],
      [
        {
          id: "disabled-login",
          operation: "LOGIN",
          window: "HOUR",
          maxCount: 5,
          enabled: false,
        },
      ],
    ),
    {
      allowed: true,
      reason: "VELOCITY_ALLOWED",
      matchedRuleIds: [],
    },
  );
});
