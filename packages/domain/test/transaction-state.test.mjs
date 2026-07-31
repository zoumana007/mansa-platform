import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransactionTransitionError,
  allowedTransactionTransitions,
  assertTransactionTransition,
  canTransitionTransaction,
} from "../dist/index.js";

test("autorise les transitions nominales", () => {
  assert.equal(canTransitionTransaction("PENDING", "AUTHORIZED"), true);
  assert.equal(canTransitionTransaction("AUTHORIZED", "PROCESSING"), true);
  assert.equal(canTransitionTransaction("PROCESSING", "SUCCEEDED"), true);
  assert.equal(canTransitionTransaction("SUCCEEDED", "REVERSED"), true);
});

test("interdit les transitions terminales ou incohérentes", () => {
  assert.equal(canTransitionTransaction("FAILED", "PROCESSING"), false);
  assert.equal(canTransitionTransaction("CANCELLED", "PENDING"), false);
  assert.equal(canTransitionTransaction("REVERSED", "SUCCEEDED"), false);
  assert.equal(canTransitionTransaction("PENDING", "SUCCEEDED"), false);
});

test("expose une liste immuable des transitions autorisées", () => {
  assert.deepEqual(allowedTransactionTransitions("PROCESSING"), [
    "SUCCEEDED",
    "FAILED",
    "CANCELLED",
  ]);
  assert.throws(() => {
    allowedTransactionTransitions("PROCESSING").push("PENDING");
  }, TypeError);
});

test("lève une erreur métier détaillée pour une transition invalide", () => {
  assert.throws(
    () => assertTransactionTransition("SUCCEEDED", "PROCESSING"),
    (error) => {
      assert.equal(error instanceof InvalidTransactionTransitionError, true);
      assert.equal(error.from, "SUCCEEDED");
      assert.equal(error.to, "PROCESSING");
      return true;
    },
  );
});
