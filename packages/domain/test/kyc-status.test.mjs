import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidKycTransitionError,
  KycState,
  isKycStatus,
} from "../dist/index.js";

test("initialise le KYC dans l'état non démarré", () => {
  const state = KycState.create();

  assert.deepEqual(state.toJSON(), {
    status: "not_started",
    verified: false,
    requiresAction: true,
  });
});

test("autorise le parcours nominal de vérification", () => {
  const verified = KycState.create()
    .transitionTo("in_progress")
    .transitionTo("pending_review")
    .transitionTo("verified");

  assert.equal(verified.isVerified(), true);
  assert.equal(verified.requiresAction(), false);
});

test("refuse un passage direct vers vérifié", () => {
  assert.throws(
    () => KycState.create().transitionTo("verified"),
    InvalidKycTransitionError,
  );
});

test("permet de reprendre un dossier rejeté ou expiré", () => {
  const rejected = KycState.create("rejected").transitionTo("in_progress");
  const expired = KycState.create("expired").transitionTo("in_progress");

  assert.equal(rejected.status, "in_progress");
  assert.equal(expired.status, "in_progress");
});

test("rend une transition identique idempotente", () => {
  const pending = KycState.create("pending_review");

  assert.equal(pending.transitionTo("pending_review").status, "pending_review");
});

test("valide les statuts provenant des frontières externes", () => {
  assert.equal(isKycStatus("verified"), true);
  assert.equal(isKycStatus("approved"), false);
});
