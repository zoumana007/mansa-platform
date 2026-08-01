import assert from "node:assert/strict";
import test from "node:test";

import { MerchantProfile } from "../dist/index.js";

const createdAt = new Date("2026-08-01T08:00:00.000Z");

function merchant(overrides = {}) {
  return new MerchantProfile({
    id: "merchant_001",
    ownerId: "user_001",
    legalName: "Mansa Commerce SARL",
    displayName: "Boutique Mansa",
    countryCode: "ML",
    settlementCurrency: "XOF",
    createdAt,
    ...overrides,
  });
}

test("crée un commerçant en brouillon", () => {
  const profile = merchant();

  assert.equal(profile.status, "draft");
  assert.equal(profile.canAcceptPayments(), false);
});

test("valide les identifiants et codes normalisés", () => {
  assert.throws(() => merchant({ ownerId: " " }), /owner id is required/);
  assert.throws(() => merchant({ countryCode: "Mali" }), /ISO 3166-1/);
  assert.throws(() => merchant({ settlementCurrency: "franc" }), /ISO 4217/);

  const profile = merchant({ countryCode: "ml", settlementCurrency: "xof" });
  assert.equal(profile.countryCode, "ML");
  assert.equal(profile.settlementCurrency, "XOF");
});

test("soumet puis approuve un commerçant", () => {
  const profile = merchant();

  profile.submitForReview();
  assert.equal(profile.status, "pending_review");

  profile.approve();
  assert.equal(profile.status, "active");
  assert.equal(profile.canAcceptPayments(), true);
});

test("rejette une demande avec motif obligatoire", () => {
  const profile = merchant();
  profile.submitForReview();

  assert.throws(() => profile.reject(" "), /reason is required/);
  profile.reject("Document d’immatriculation illisible");

  assert.equal(profile.status, "rejected");
  assert.equal(profile.statusReason, "Document d’immatriculation illisible");
  assert.equal(profile.canAcceptPayments(), false);
});

test("suspend puis réactive un commerçant actif", () => {
  const profile = merchant();
  profile.submitForReview();
  profile.approve();

  profile.suspend("Contrôle conformité en cours");
  assert.equal(profile.status, "suspended");
  assert.equal(profile.canAcceptPayments(), false);

  profile.reactivate();
  assert.equal(profile.status, "active");
  assert.equal(profile.statusReason, null);
});

test("refuse les transitions non autorisées", () => {
  const profile = merchant();

  assert.throws(() => profile.approve(), /Only a pending/);
  assert.throws(() => profile.suspend("motif"), /Only an active/);
  assert.throws(() => profile.reactivate(), /Only a suspended/);
});

test("ferme définitivement un profil avec un motif", () => {
  const profile = merchant();

  profile.close("Fermeture demandée par le propriétaire");
  assert.equal(profile.status, "closed");
  assert.equal(profile.canAcceptPayments(), false);
  assert.throws(() => profile.close("nouveau motif"), /current status/);
});

test("sérialise un profil sans donnée sensible", () => {
  const profile = merchant();
  profile.submitForReview();
  profile.approve();

  assert.deepEqual(profile.toJSON(), {
    id: "merchant_001",
    ownerId: "user_001",
    legalName: "Mansa Commerce SARL",
    displayName: "Boutique Mansa",
    countryCode: "ML",
    settlementCurrency: "XOF",
    status: "active",
    statusReason: null,
    createdAt: createdAt.toISOString(),
  });
});
