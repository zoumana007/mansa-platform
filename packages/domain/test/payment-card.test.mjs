import assert from "node:assert/strict";
import test from "node:test";

import { PaymentCard } from "../dist/index.js";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const expiresAt = new Date("2029-08-01T00:00:00.000Z");

function card(overrides = {}) {
  return new PaymentCard({
    id: "card_001",
    ownerId: "user_001",
    type: "virtual",
    last4: "4242",
    createdAt,
    expiresAt,
    ...overrides,
  });
}

test("crée une carte en attente avec données masquées", () => {
  const paymentCard = card();

  assert.equal(paymentCard.status, "pending");
  assert.equal(paymentCard.canAuthorize(createdAt), false);
  assert.deepEqual(paymentCard.toJSON(), {
    id: "card_001",
    ownerId: "user_001",
    type: "virtual",
    last4: "4242",
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "pending",
  });
});

test("refuse un identifiant propriétaire vide et un last4 invalide", () => {
  assert.throws(() => card({ ownerId: " " }), /owner id is required/);
  assert.throws(() => card({ last4: "42" }), /exactly four digits/);
  assert.throws(() => card({ last4: "12ab" }), /exactly four digits/);
});

test("active une carte en attente avant expiration", () => {
  const paymentCard = card();

  paymentCard.activate(createdAt);

  assert.equal(paymentCard.status, "active");
  assert.equal(paymentCard.canAuthorize(createdAt), true);
  assert.throws(() => paymentCard.activate(createdAt), /Only a pending/);
});

test("gèle puis réactive une carte active", () => {
  const paymentCard = card();
  paymentCard.activate(createdAt);

  paymentCard.freeze();
  assert.equal(paymentCard.status, "frozen");
  assert.equal(paymentCard.canAuthorize(createdAt), false);

  paymentCard.unfreeze(createdAt);
  assert.equal(paymentCard.status, "active");
});

test("bloque définitivement une carte active ou en attente", () => {
  const pendingCard = card();
  pendingCard.block();
  assert.equal(pendingCard.status, "blocked");
  assert.equal(pendingCard.canAuthorize(createdAt), false);
  assert.throws(() => pendingCard.block(), /current status/);
});

test("n’expire une carte qu’à son échéance", () => {
  const paymentCard = card();

  assert.throws(() => paymentCard.expire(createdAt), /before its deadline/);
  paymentCard.expire(expiresAt);

  assert.equal(paymentCard.status, "expired");
  assert.equal(paymentCard.canAuthorize(expiresAt), false);
});

test("termine une carte et interdit une seconde terminaison", () => {
  const paymentCard = card();

  paymentCard.terminate();

  assert.equal(paymentCard.status, "terminated");
  assert.throws(() => paymentCard.terminate(), /already terminated/);
});

test("protège les dates internes contre les mutations externes", () => {
  const mutableCreatedAt = new Date(createdAt);
  const mutableExpiresAt = new Date(expiresAt);
  const paymentCard = card({
    createdAt: mutableCreatedAt,
    expiresAt: mutableExpiresAt,
  });

  mutableCreatedAt.setUTCFullYear(2035);
  mutableExpiresAt.setUTCFullYear(2035);

  assert.equal(paymentCard.createdAt.toISOString(), createdAt.toISOString());
  assert.equal(paymentCard.expiresAt.toISOString(), expiresAt.toISOString());
});
