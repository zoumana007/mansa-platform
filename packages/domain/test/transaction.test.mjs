import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransactionAmountError,
  InvalidTransactionTransitionError,
  Money,
  Transaction,
} from "../dist/index.js";

const reference = "MNSA-ML-20260731-ABCDEF123456";

test("crée une transaction en attente avec un montant positif", () => {
  const now = new Date("2026-07-31T09:30:00.000Z");
  const transaction = Transaction.create({
    reference,
    kind: "PAYMENT",
    amount: Money.ofMinor(1500n, "XOF"),
    now,
  });

  const snapshot = transaction.current();
  assert.equal(snapshot.reference, reference);
  assert.equal(snapshot.kind, "PAYMENT");
  assert.equal(snapshot.state, "PENDING");
  assert.equal(snapshot.amount.minor, 1500n);
  assert.equal(snapshot.createdAt.toISOString(), now.toISOString());
});

test("refuse un montant nul ou négatif", () => {
  assert.throws(
    () =>
      Transaction.create({
        reference,
        kind: "TRANSFER",
        amount: Money.zero("XOF"),
      }),
    InvalidTransactionAmountError,
  );
});

test("applique les transitions du cycle de vie", () => {
  const transaction = Transaction.create({
    reference,
    kind: "CASH_IN",
    amount: Money.ofMinor(5000n, "XOF"),
    now: new Date("2026-07-31T09:30:00.000Z"),
  });

  transaction.transition("PROCESSING", new Date("2026-07-31T09:31:00.000Z"));
  transaction.transition("SUCCEEDED", new Date("2026-07-31T09:32:00.000Z"));

  assert.equal(transaction.current().state, "SUCCEEDED");
  assert.equal(
    transaction.current().updatedAt.toISOString(),
    "2026-07-31T09:32:00.000Z",
  );
});

test("refuse une transition métier invalide et un retour temporel", () => {
  const transaction = Transaction.create({
    reference,
    kind: "PAYMENT",
    amount: Money.ofMinor(2500n, "XOF"),
    now: new Date("2026-07-31T09:30:00.000Z"),
  });

  assert.throws(
    () => transaction.transition("SUCCEEDED"),
    InvalidTransactionTransitionError,
  );
  assert.throws(
    () => transaction.transition("PROCESSING", new Date("2026-07-31T09:29:00.000Z")),
    /cannot move backwards/,
  );
});

test("restaure un instantané valide sans exposer les dates internes", () => {
  const createdAt = new Date("2026-07-31T09:30:00.000Z");
  const updatedAt = new Date("2026-07-31T09:35:00.000Z");
  const transaction = Transaction.restore({
    reference: reference.toLowerCase(),
    kind: "REFUND",
    amount: Money.ofMinor(900n, "XOF"),
    state: "PROCESSING",
    createdAt,
    updatedAt,
  });

  createdAt.setUTCFullYear(2000);
  const snapshot = transaction.current();
  snapshot.updatedAt.setUTCFullYear(2000);

  assert.equal(transaction.current().reference, reference);
  assert.equal(transaction.current().createdAt.getUTCFullYear(), 2026);
  assert.equal(transaction.current().updatedAt.getUTCFullYear(), 2026);
});
