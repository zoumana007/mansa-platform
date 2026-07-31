import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidAvailableBalanceError,
  assertSufficientAvailableBalance,
  calculateAvailableBalance,
} from "../dist/index.js";

test("soustrait uniquement les réservations actives", () => {
  const balance = calculateAvailableBalance(10_000n, [
    { id: "auth-1", amountMinor: 2_000n, status: "ACTIVE" },
    { id: "auth-2", amountMinor: 1_000n, status: "RELEASED" },
    { id: "auth-3", amountMinor: 500n, status: "EXPIRED" },
  ]);

  assert.deepEqual(balance, {
    ledgerBalanceMinor: 10_000n,
    reservedMinor: 2_000n,
    availableMinor: 8_000n,
  });
});

test("autorise un solde disponible négatif pour révéler une anomalie", () => {
  const balance = calculateAvailableBalance(1_000n, [
    { id: "auth-1", amountMinor: 1_500n, status: "ACTIVE" },
  ]);

  assert.equal(balance.availableMinor, -500n);
});

test("refuse les réservations actives dupliquées", () => {
  assert.throws(
    () =>
      calculateAvailableBalance(10_000n, [
        { id: "auth-1", amountMinor: 500n, status: "ACTIVE" },
        { id: "auth-1", amountMinor: 500n, status: "ACTIVE" },
      ]),
    /duplicate active reservation id/,
  );
});

test("refuse une réservation sans identifiant ou montant positif", () => {
  assert.throws(
    () => calculateAvailableBalance(10_000n, [{ id: " ", amountMinor: 1n, status: "ACTIVE" }]),
    InvalidAvailableBalanceError,
  );
  assert.throws(
    () => calculateAvailableBalance(10_000n, [{ id: "auth-1", amountMinor: 0n, status: "ACTIVE" }]),
    /reservation amountMinor must be positive/,
  );
});

test("contrôle la disponibilité avant débit", () => {
  assert.doesNotThrow(() => assertSufficientAvailableBalance(5_000n, 5_000n));
  assert.throws(
    () => assertSufficientAvailableBalance(4_999n, 5_000n),
    /insufficient available balance/,
  );
  assert.throws(
    () => assertSufficientAvailableBalance(5_000n, 0n),
    /requestedMinor must be positive/,
  );
});
