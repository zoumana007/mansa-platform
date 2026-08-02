import assert from "node:assert/strict";
import test from "node:test";

import {
  PERMISSIONS,
  PERMISSION_CATALOG,
  REFERENCE_ROLES,
  getPermissionDefinition,
  isPermission,
  isReferenceRole,
} from "../dist/permission-catalog.js";

test("le catalogue contient chaque permission exactement une fois", () => {
  assert.equal(new Set(PERMISSIONS).size, PERMISSIONS.length);
  assert.equal(PERMISSION_CATALOG.length, PERMISSIONS.length);
  assert.deepEqual(
    new Set(PERMISSION_CATALOG.map(({ permission }) => permission)),
    new Set(PERMISSIONS),
  );
});

test("les rôles de référence restent sans doublon", () => {
  assert.equal(new Set(REFERENCE_ROLES).size, REFERENCE_ROLES.length);
  assert.equal(isReferenceRole("CLIENT"), true);
  assert.equal(isReferenceRole("SUPER_ADMIN"), true);
  assert.equal(isReferenceRole("UNKNOWN_ROLE"), false);
});

test("une permission inconnue est refusée par défaut", () => {
  assert.equal(isPermission("identity.user.read"), true);
  assert.equal(isPermission("identity.user.delete-everything"), false);
  assert.equal(isPermission("IDENTITY.USER.READ"), false);
});

test("les actions critiques de production déclarent une approbation", () => {
  const criticalPermissions = [
    "finance.adjustment.approve",
    "finance.reconciliation.approve",
    "administration.role.assign",
    "administration.feature-flag.update",
    "administration.fee.update",
    "administration.limit.update",
    "administration.partner.activate",
    "audit.export.create",
    "public-service.payment.cancel",
    "public-service.catalog.update",
  ];

  for (const permission of criticalPermissions) {
    assert.equal(isPermission(permission), true);
    assert.equal(
      getPermissionDefinition(permission).approvalRequiredInProduction,
      true,
    );
  }
});

test("chaque définition possède une description et un niveau d’authentification", () => {
  for (const definition of PERMISSION_CATALOG) {
    assert.ok(definition.description.length > 0);
    assert.ok([
      "ANONYMOUS",
      "PRIMARY_FACTOR",
      "MULTI_FACTOR",
      "HARDWARE_BOUND",
    ].includes(definition.minimumAuthenticationLevel));
  }
});
