import assert from "node:assert/strict";
import test from "node:test";

import { SavingsGoal } from "../dist/index.js";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const targetDate = new Date("2027-08-01T00:00:00.000Z");

function goal(overrides = {}) {
  return new SavingsGoal({
    id: "goal_001",
    ownerId: "user_001",
    name: "Fonds d’urgence",
    currency: "XOF",
    targetMinor: 100000n,
    createdAt,
    targetDate,
    ...overrides,
  });
}

test("crée un objectif actif avec montants en unités mineures", () => {
  const savingsGoal = goal();

  assert.equal(savingsGoal.status, "active");
  assert.equal(savingsGoal.currentMinor, 0n);
  assert.equal(savingsGoal.remainingMinor, 100000n);
});

test("refuse les données invalides", () => {
  assert.throws(() => goal({ ownerId: " " }), /owner id is required/);
  assert.throws(() => goal({ currency: "franc" }), /ISO 4217/);
  assert.throws(() => goal({ targetMinor: 0n }), /target must be positive/);
  assert.throws(() => goal({ currentMinor: 100001n }), /current amount is invalid/);
  assert.throws(
    () => goal({ targetDate: new Date("2025-01-01T00:00:00.000Z") }),
    /target date must be after creation/,
  );
});

test("enregistre des contributions et termine à l’objectif exact", () => {
  const savingsGoal = goal();

  savingsGoal.contribute(40000n);
  assert.equal(savingsGoal.currentMinor, 40000n);
  assert.equal(savingsGoal.remainingMinor, 60000n);

  savingsGoal.contribute(60000n);
  assert.equal(savingsGoal.status, "completed");
  assert.equal(savingsGoal.remainingMinor, 0n);
  assert.throws(() => savingsGoal.contribute(1n), /Only an active/);
});

test("interdit le dépassement de cible", () => {
  const savingsGoal = goal();

  assert.throws(() => savingsGoal.contribute(100001n), /exceeds target/);
  assert.throws(() => savingsGoal.contribute(0n), /must be positive/);
});

test("autorise un retrait contrôlé", () => {
  const savingsGoal = goal({ currentMinor: 50000n });

  savingsGoal.withdraw(20000n);

  assert.equal(savingsGoal.currentMinor, 30000n);
  assert.throws(() => savingsGoal.withdraw(40000n), /amount is invalid/);
});

test("met en pause puis reprend un objectif", () => {
  const savingsGoal = goal();

  savingsGoal.pause();
  assert.equal(savingsGoal.status, "paused");
  assert.throws(() => savingsGoal.contribute(1000n), /Only an active/);

  savingsGoal.resume();
  assert.equal(savingsGoal.status, "active");
});

test("annule un objectif non terminé", () => {
  const savingsGoal = goal();

  savingsGoal.cancel();

  assert.equal(savingsGoal.status, "cancelled");
  assert.throws(() => savingsGoal.cancel(), /current status/);
});

test("sérialise les bigint sans perte de précision", () => {
  const savingsGoal = goal({ currentMinor: 25000n });

  assert.deepEqual(savingsGoal.toJSON(), {
    id: "goal_001",
    ownerId: "user_001",
    name: "Fonds d’urgence",
    currency: "XOF",
    targetMinor: "100000",
    currentMinor: "25000",
    remainingMinor: "75000",
    targetDate: targetDate.toISOString(),
    createdAt: createdAt.toISOString(),
    status: "active",
  });
});
