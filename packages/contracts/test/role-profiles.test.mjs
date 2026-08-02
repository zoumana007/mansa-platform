import assert from "node:assert/strict";
import test from "node:test";

import { PERMISSIONS, REFERENCE_ROLES } from "../dist/permission-catalog.js";
import {
  REFERENCE_ROLE_PROFILES,
  getReferenceRoleProfile,
  roleProfileAllowsActorType,
  roleProfileAllowsScope,
} from "../dist/role-profiles.js";

test("chaque rôle de référence possède exactement un profil", () => {
  assert.deepEqual(
    new Set(Object.keys(REFERENCE_ROLE_PROFILES)),
    new Set(REFERENCE_ROLES),
  );

  for (const role of REFERENCE_ROLES) {
    assert.equal(getReferenceRoleProfile(role).role, role);
  }
});

test("chaque profil référence uniquement des permissions cataloguées", () => {
  const knownPermissions = new Set(PERMISSIONS);

  for (const profile of Object.values(REFERENCE_ROLE_PROFILES)) {
    assert.ok(profile.description.length > 0);
    assert.ok(profile.actorTypes.length > 0);
    assert.ok(profile.allowedScopeTypes.length > 0);

    for (const permission of profile.permissions) {
      assert.equal(knownPermissions.has(permission), true, `${profile.role}: ${permission}`);
    }
  }
});

test("les types d’acteurs restent séparés", () => {
  assert.equal(roleProfileAllowsActorType("CLIENT", "USER"), true);
  assert.equal(roleProfileAllowsActorType("CLIENT", "ADMIN"), false);
  assert.equal(roleProfileAllowsActorType("MERCHANT_CASHIER", "MERCHANT_MEMBER"), true);
  assert.equal(roleProfileAllowsActorType("SERVICE_AI", "SERVICE"), true);
  assert.equal(roleProfileAllowsActorType("SERVICE_AI", "USER"), false);
});

test("les périmètres sensibles restent limités", () => {
  assert.equal(roleProfileAllowsScope("COUNTRY_ADMIN", "COUNTRY"), true);
  assert.equal(roleProfileAllowsScope("COUNTRY_ADMIN", "PLATFORM"), false);
  assert.equal(roleProfileAllowsScope("MERCHANT_CASHIER", "LOCATION"), true);
  assert.equal(roleProfileAllowsScope("MERCHANT_CASHIER", "PLATFORM"), false);
});

test("les profils système sont explicitement gérés par le système", () => {
  const systemRoles = [
    "SUPER_ADMIN",
    "SERVICE_API_GATEWAY",
    "SERVICE_WORKER",
    "SERVICE_NOTIFICATION",
    "SERVICE_RECONCILIATION",
    "SERVICE_AI",
  ];

  for (const role of systemRoles) {
    assert.equal(getReferenceRoleProfile(role).systemManaged, true);
  }
});

test("la séparation finance proposition approbation est conservée", () => {
  const operator = getReferenceRoleProfile("FINANCE_OPERATOR").permissions;
  const approver = getReferenceRoleProfile("FINANCE_APPROVER").permissions;

  assert.equal(operator.includes("finance.adjustment.propose"), true);
  assert.equal(operator.includes("finance.adjustment.approve"), false);
  assert.equal(approver.includes("finance.adjustment.approve"), true);
  assert.equal(approver.includes("finance.adjustment.propose"), false);
});
