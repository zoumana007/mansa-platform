import assert from "node:assert/strict";
import test from "node:test";

import {
  isSensitivePermission,
  privilegedAccessRequirements,
} from "./privileged-access.js";

test("identifie les permissions sensibles", () => {
  assert.equal(isSensitivePermission("identity.document.read_sensitive"), true);
  assert.equal(isSensitivePermission("payment.read"), false);
});

test("renforce une action sensible en production", () => {
  const requirements = privilegedAccessRequirements({
    permission: "partner.manage",
    environment: "PRODUCTION",
  });

  assert.deepEqual(requirements, {
    sensitive: true,
    requireRecentAuthentication: true,
    requireMultiFactorAuthentication: true,
    requireJustification: true,
    requireAuditEvent: true,
    requireDualApproval: true,
  });
});

test("n'impose pas de contrôle privilégié à une simple lecture", () => {
  const requirements = privilegedAccessRequirements({
    permission: "payment.read",
    environment: "DEMO",
  });

  assert.deepEqual(requirements, {
    sensitive: false,
    requireRecentAuthentication: false,
    requireMultiFactorAuthentication: false,
    requireJustification: false,
    requireAuditEvent: false,
    requireDualApproval: false,
  });
});

test("impose la double validation au-dessus du seuil financier", () => {
  const requirements = privilegedAccessRequirements({
    permission: "payment.refund",
    environment: "STAGING",
    amountMinor: 500_000n,
    elevatedAmountThresholdMinor: 500_000n,
  });

  assert.equal(requirements.requireDualApproval, true);
  assert.equal(requirements.requireAuditEvent, true);
});

test("renforce toute opération à risque critique", () => {
  const requirements = privilegedAccessRequirements({
    permission: "support.case.update",
    environment: "STAGING",
    riskLevel: "CRITICAL",
  });

  assert.equal(requirements.requireRecentAuthentication, true);
  assert.equal(requirements.requireMultiFactorAuthentication, true);
  assert.equal(requirements.requireDualApproval, true);
  assert.equal(requirements.requireAuditEvent, true);
});
