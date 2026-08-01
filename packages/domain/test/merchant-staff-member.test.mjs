import assert from "node:assert/strict";
import test from "node:test";

import { MerchantStaffMember } from "../dist/index.js";

function staff(overrides = {}) {
  return new MerchantStaffMember({
    id: "staff_001",
    merchantId: "merchant_001",
    userId: "user_002",
    role: "cashier",
    createdAt: new Date("2026-08-01T09:00:00.000Z"),
    ...overrides,
  });
}

test("invite puis active un employé", () => {
  const member = staff();
  assert.equal(member.status, "invited");
  assert.equal(member.can("payments.accept"), false);
  member.activate();
  assert.equal(member.status, "active");
  assert.equal(member.can("payments.accept"), true);
});

test("applique les permissions selon le rôle", () => {
  const cashier = staff();
  cashier.activate();
  assert.equal(cashier.can("refunds.create"), false);
  cashier.changeRole("manager");
  assert.equal(cashier.can("refunds.create"), true);
  assert.equal(cashier.can("merchant.manage"), false);
});

test("suspend, réactive puis révoque un employé", () => {
  const member = staff();
  member.activate();
  member.suspend("Contrôle interne");
  assert.equal(member.can("payments.accept"), false);
  assert.equal(member.statusReason, "Contrôle interne");
  member.reactivate();
  assert.equal(member.statusReason, null);
  member.revoke("Fin de contrat");
  assert.equal(member.status, "revoked");
  assert.throws(() => member.changeRole("manager"), /revoked/);
});

test("refuse les identifiants et motifs vides", () => {
  assert.throws(() => staff({ merchantId: " " }), /Merchant id is required/);
  const member = staff();
  member.activate();
  assert.throws(() => member.suspend(" "), /status reason is required/);
});

test("sérialise sans secret ni permission persistée", () => {
  const member = staff({ role: "support" });
  member.activate();
  assert.deepEqual(member.toJSON(), {
    id: "staff_001",
    merchantId: "merchant_001",
    userId: "user_002",
    role: "support",
    status: "active",
    statusReason: null,
    createdAt: "2026-08-01T09:00:00.000Z",
  });
});
