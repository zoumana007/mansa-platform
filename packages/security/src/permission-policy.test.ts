import assert from "node:assert/strict";
import test from "node:test";

import { PERMISSIONS } from "./index.js";
import {
  PERMISSION_POLICIES,
  permissionPolicy,
  requiresAuditReason,
  requiresProductionDualApproval,
} from "./permission-policy.js";

test("définit une politique pour chaque permission déclarée", () => {
  assert.deepEqual(Object.keys(PERMISSION_POLICIES).sort(), [...PERMISSIONS].sort());
});

test("n'impose la double approbation qu'aux opérations sensibles", () => {
  for (const [permission, policy] of Object.entries(PERMISSION_POLICIES)) {
    if (policy.productionDualApproval) {
      assert.equal(policy.sensitive, true, `${permission} doit être sensible`);
      assert.equal(policy.requiresReason, true, `${permission} doit exiger un motif`);
    }
  }
});

test("protège les ajustements du grand livre en production", () => {
  assert.equal(
    requiresProductionDualApproval("ledger.adjustment.approve"),
    true,
  );
  assert.equal(requiresAuditReason("ledger.adjustment.approve"), true);
});

test("protège les règles financières et partenaires", () => {
  for (const permission of [
    "fee_rule.manage",
    "limit_rule.manage",
    "partner.manage",
    "merchant.settlement.configure",
  ] as const) {
    assert.equal(requiresProductionDualApproval(permission), true);
  }
});

test("la lecture ordinaire ne déclenche pas de validation supplémentaire", () => {
  const policy = permissionPolicy("configuration.read");

  assert.equal(policy.sensitive, false);
  assert.equal(policy.productionDualApproval, false);
  assert.equal(policy.requiresReason, false);
});
