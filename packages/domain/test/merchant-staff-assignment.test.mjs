import assert from "node:assert/strict";
import test from "node:test";

import { MerchantStaffAssignment } from "../dist/index.js";

function assignment(overrides = {}) {
  return new MerchantStaffAssignment({
    id: "assignment_001",
    merchantId: "merchant_001",
    staffMemberId: "staff_001",
    locationId: "location_001",
    permissions: ["payments.accept", "transactions.read"],
    maxTransactionAmountMinor: 250000n,
    createdAt: new Date("2026-08-01T11:00:00.000Z"),
    ...overrides,
  });
}

test("autorise une permission dans la limite du point de vente", () => {
  const scope = assignment();
  assert.equal(scope.allows("payments.accept", 250000n), true);
  assert.equal(scope.allows("payments.accept", 250001n), false);
  assert.equal(scope.allows("refunds.create", 1000n), false);
});

test("normalise et remplace les permissions", () => {
  const scope = assignment({ permissions: [" Payments.Accept ", "payments.accept"] });
  assert.deepEqual(scope.permissions, ["payments.accept"]);
  scope.replacePermissions(["reports.read"]);
  assert.equal(scope.allows("reports.read"), true);
  assert.equal(scope.allows("payments.accept"), false);
});

test("suspend puis réactive une affectation", () => {
  const scope = assignment();
  scope.suspend("Changement d'équipe");
  assert.equal(scope.status, "suspended");
  assert.equal(scope.statusReason, "Changement d'équipe");
  assert.equal(scope.allows("payments.accept", 1000n), false);
  scope.reactivate();
  assert.equal(scope.status, "active");
  assert.equal(scope.statusReason, null);
});

test("révoque définitivement une affectation", () => {
  const scope = assignment();
  scope.revoke("Départ de l'employé");
  assert.equal(scope.status, "revoked");
  assert.equal(scope.allows("payments.accept", 1000n), false);
  assert.throws(() => scope.replacePermissions(["reports.read"]), /revoked/);
  assert.throws(() => scope.setTransactionLimit(1000n), /revoked/);
  assert.throws(() => scope.reactivate(), /suspended/);
});

test("refuse les identifiants, permissions et limites invalides", () => {
  assert.throws(() => assignment({ locationId: " " }), /location id is required/);
  assert.throws(() => assignment({ permissions: [" "] }), /permission is required/);
  assert.throws(() => assignment({ maxTransactionAmountMinor: -1n }), /cannot be negative/);
});

test("sérialise les montants mineurs sans nombre flottant", () => {
  assert.deepEqual(assignment().toJSON(), {
    id: "assignment_001",
    merchantId: "merchant_001",
    staffMemberId: "staff_001",
    locationId: "location_001",
    permissions: ["payments.accept", "transactions.read"],
    maxTransactionAmountMinor: "250000",
    status: "active",
    statusReason: null,
    createdAt: "2026-08-01T11:00:00.000Z",
  });
});
