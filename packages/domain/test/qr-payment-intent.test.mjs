import assert from "node:assert/strict";
import test from "node:test";

import { Money, QrPaymentIntent } from "../dist/index.js";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const expiresAt = new Date("2026-08-01T00:05:00.000Z");

function intent(overrides = {}) {
  return new QrPaymentIntent({
    id: "qr_001",
    merchantId: "merchant_001",
    amount: Money.ofMinor(15_000n, "XOF"),
    reference: "Commande 42",
    createdAt,
    expiresAt,
    ...overrides,
  });
}

test("crée une intention QR active et payable", () => {
  const paymentIntent = intent();

  assert.equal(paymentIntent.status, "active");
  assert.equal(
    paymentIntent.isPayable(new Date("2026-08-01T00:04:59.999Z")),
    true,
  );
  assert.deepEqual(paymentIntent.toJSON(), {
    id: "qr_001",
    merchantId: "merchant_001",
    amount: { minor: "15000", currency: "XOF" },
    reference: "Commande 42",
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "active",
  });
});

test("accepte un QR dynamique sans montant imposé", () => {
  const paymentIntent = intent({ amount: null });

  assert.equal(paymentIntent.amount, null);
  assert.equal(paymentIntent.isPayable(createdAt), true);
});

test("refuse un montant nul ou négatif", () => {
  for (const amount of [
    Money.ofMinor(0n, "XOF"),
    Money.ofMinor(-1n, "XOF"),
  ]) {
    assert.throws(() => intent({ amount }), /amount must be positive/);
  }
});

test("refuse une expiration antérieure ou égale à la création", () => {
  assert.throws(
    () => intent({ expiresAt: createdAt }),
    /expiration must be after creation/,
  );
});

test("consomme une intention une seule fois", () => {
  const paymentIntent = intent();

  paymentIntent.consume(new Date("2026-08-01T00:02:00.000Z"));

  assert.equal(paymentIntent.status, "consumed");
  assert.equal(paymentIntent.isPayable(), false);
  assert.throws(() => paymentIntent.consume(createdAt), /not payable/);
});

test("expire uniquement après l’échéance", () => {
  const paymentIntent = intent();

  assert.throws(() => paymentIntent.expire(createdAt), /before its deadline/);
  paymentIntent.expire(expiresAt);

  assert.equal(paymentIntent.status, "expired");
  assert.equal(paymentIntent.isPayable(expiresAt), false);
});

test("annule uniquement une intention active", () => {
  const paymentIntent = intent();

  paymentIntent.cancel();

  assert.equal(paymentIntent.status, "cancelled");
  assert.throws(() => paymentIntent.cancel(), /Only an active/);
});

test("protège les dates internes contre les mutations externes", () => {
  const mutableCreatedAt = new Date(createdAt);
  const mutableExpiresAt = new Date(expiresAt);
  const paymentIntent = intent({
    createdAt: mutableCreatedAt,
    expiresAt: mutableExpiresAt,
  });

  mutableCreatedAt.setUTCFullYear(2030);
  mutableExpiresAt.setUTCFullYear(2030);

  assert.equal(paymentIntent.createdAt.toISOString(), createdAt.toISOString());
  assert.equal(paymentIntent.expiresAt.toISOString(), expiresAt.toISOString());
});
