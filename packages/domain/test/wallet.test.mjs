import assert from "node:assert/strict";
import test from "node:test";

import { Money, Wallet } from "../dist/index.js";

const createdAt = new Date("2026-07-31T12:00:00.000Z");

function createWallet() {
  return Wallet.create({
    id: "wallet-1",
    ownerId: "user-1",
    currency: "XOF",
    createdAt,
  });
}

test("crée un wallet actif avec un solde disponible nul", () => {
  const wallet = createWallet();

  assert.equal(wallet.status, "ACTIVE");
  assert.deepEqual(wallet.availableBalance.toJSON(), {
    minor: "0",
    currency: "XOF",
  });
  assert.equal(wallet.updatedAt.toISOString(), createdAt.toISOString());
});

test("crédite puis débite un montant dans la devise du wallet", () => {
  const wallet = createWallet();

  wallet.credit(
    Money.ofMinor(10_000n, "XOF"),
    new Date("2026-07-31T12:01:00.000Z"),
  );
  wallet.debit(
    Money.ofMinor(2_500n, "XOF"),
    new Date("2026-07-31T12:02:00.000Z"),
  );

  assert.equal(wallet.availableBalance.minor, 7_500n);
  assert.equal(wallet.updatedAt.toISOString(), "2026-07-31T12:02:00.000Z");
});

test("refuse un débit supérieur au solde disponible", () => {
  const wallet = createWallet();

  assert.throws(
    () => wallet.debit(Money.ofMinor(1n, "XOF")),
    /Insufficient available balance/,
  );
});

test("refuse les opérations sur un wallet suspendu", () => {
  const wallet = createWallet();
  wallet.suspend(new Date("2026-07-31T12:01:00.000Z"));

  assert.equal(wallet.status, "SUSPENDED");
  assert.throws(
    () => wallet.credit(Money.ofMinor(500n, "XOF")),
    /Wallet is not active: SUSPENDED/,
  );
});

test("ferme uniquement un wallet dont le solde est nul", () => {
  const wallet = createWallet();
  wallet.credit(Money.ofMinor(1_000n, "XOF"));

  assert.throws(() => wallet.close(), /balance must be zero/);

  wallet.debit(Money.ofMinor(1_000n, "XOF"));
  wallet.close();

  assert.equal(wallet.status, "CLOSED");
  assert.throws(() => wallet.activate(), /closed wallet cannot be activated/);
});

test("refuse les devises incompatibles et les montants non positifs", () => {
  const wallet = createWallet();

  assert.throws(
    () => wallet.credit(Money.ofMinor(100n, "EUR")),
    /currency must match/,
  );
  assert.throws(
    () => wallet.credit(Money.zero("XOF")),
    /strictly positive/,
  );
});
