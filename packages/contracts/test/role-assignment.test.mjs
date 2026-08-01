import assert from "node:assert/strict";
import test from "node:test";

import {
  ROLE_ASSIGNMENT_STATUSES,
  ROLE_SCOPE_TYPES,
  isRoleAssignmentStatus,
  isRoleScopeType,
} from "../dist/index.js";

test("reconnaît les statuts d’affectation de rôle", () => {
  for (const status of ROLE_ASSIGNMENT_STATUSES) {
    assert.equal(isRoleAssignmentStatus(status), true);
  }

  assert.equal(isRoleAssignmentStatus("DELETED"), false);
});

test("reconnaît les types de portée de rôle", () => {
  for (const scopeType of ROLE_SCOPE_TYPES) {
    assert.equal(isRoleScopeType(scopeType), true);
  }

  assert.equal(isRoleScopeType("DEVICE"), false);
});

test("les catalogues d’affectation restent sans doublon", () => {
  assert.equal(
    new Set(ROLE_ASSIGNMENT_STATUSES).size,
    ROLE_ASSIGNMENT_STATUSES.length,
  );
  assert.equal(new Set(ROLE_SCOPE_TYPES).size, ROLE_SCOPE_TYPES.length);
});
