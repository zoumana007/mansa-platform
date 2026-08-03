import assert from "node:assert/strict";
import test from "node:test";

import { PERMISSIONS, ROLES } from "./index.js";
import {
  ROLE_PERMISSIONS,
  permissionsForRoles,
  roleHasPermission,
} from "./role-policy.js";

test("définit une politique pour chaque rôle connu", () => {
  assert.deepEqual(Object.keys(ROLE_PERMISSIONS).sort(), [...ROLES].sort());
});

test("n'accorde que des permissions déclarées dans le catalogue", () => {
  const permissionSet = new Set(PERMISSIONS);

  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of permissions) {
      assert.equal(
        permissionSet.has(permission),
        true,
        `${role} référence une permission inconnue: ${permission}`,
      );
    }
  }
});

test("ne contient aucun doublon dans un même rôle", () => {
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    assert.equal(
      new Set(permissions).size,
      permissions.length,
      `${role} contient une permission dupliquée`,
    );
  }
});

test("fusionne les permissions de plusieurs rôles sans doublon", () => {
  const permissions = permissionsForRoles(["SUPPORT_AGENT", "AUDITOR"]);

  assert.equal(permissions.includes("support.case.update"), true);
  assert.equal(permissions.includes("audit.read"), true);
  assert.equal(new Set(permissions).size, permissions.length);
});

test("retourne une liste vide sans rôle", () => {
  assert.deepEqual(permissionsForRoles([]), []);
});

test("vérifie explicitement les permissions d'un rôle", () => {
  assert.equal(roleHasPermission("MERCHANT_CASHIER", "pos.sale.create"), true);
  assert.equal(roleHasPermission("MERCHANT_CASHIER", "fee_rule.manage"), false);
});

test("préserve la séparation des tâches financières", () => {
  assert.equal(
    roleHasPermission("FINANCE_OPERATOR", "ledger.adjustment.initiate"),
    true,
  );
  assert.equal(
    roleHasPermission("FINANCE_OPERATOR", "ledger.adjustment.approve"),
    false,
  );
});

test("maintient les comptes de service sans privilège implicite", () => {
  assert.deepEqual(ROLE_PERMISSIONS.SERVICE_ACCOUNT, []);
});

test("limite un agent public aux opérations de terrain prévues", () => {
  assert.equal(
    roleHasPermission("PUBLIC_AGENT", "public_payment.collect"),
    true,
  );
  assert.equal(
    roleHasPermission("PUBLIC_AGENT", "public_service.configure"),
    false,
  );
  assert.equal(
    roleHasPermission("PUBLIC_AGENT", "public_agent.manage"),
    false,
  );
});
