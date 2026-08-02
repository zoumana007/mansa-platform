import assert from "node:assert/strict";
import test from "node:test";

import { authorize, type AuthorizationActor } from "./index.js";

const merchantOwner: AuthorizationActor = {
  actorId: "actor-owner",
  roles: ["MERCHANT_OWNER"],
  permissions: ["payment.read", "payment.refund"],
  scope: {
    countryCode: "ML",
    merchantId: "merchant-1",
  },
};

test("autorise une permission explicite dans la bonne portée", () => {
  assert.deepEqual(
    authorize({
      actor: merchantOwner,
      permission: "payment.read",
      environment: "DEMO",
      resourceScope: { countryCode: "ML", merchantId: "merchant-1" },
    }),
    { allowed: true, reason: "AUTHORIZED" },
  );
});

test("refuse une permission absente", () => {
  assert.deepEqual(
    authorize({
      actor: merchantOwner,
      permission: "fee_rule.manage",
      environment: "DEMO",
    }),
    { allowed: false, reason: "MISSING_PERMISSION" },
  );
});

test("refuse un accès à un autre commerce", () => {
  assert.deepEqual(
    authorize({
      actor: merchantOwner,
      permission: "payment.read",
      environment: "PRODUCTION",
      resourceScope: { countryCode: "ML", merchantId: "merchant-2" },
    }),
    { allowed: false, reason: "SCOPE_MISMATCH" },
  );
});

test("refuse l’auto-approbation", () => {
  assert.deepEqual(
    authorize({
      actor: merchantOwner,
      permission: "payment.refund",
      environment: "PRODUCTION",
      requiresDualApproval: true,
      approverActorId: merchantOwner.actorId,
    }),
    { allowed: false, reason: "SELF_APPROVAL_FORBIDDEN" },
  );
});

test("un client ne peut lire la ressource d’un autre client", () => {
  const customer: AuthorizationActor = {
    actorId: "customer-1",
    roles: ["CUSTOMER"],
    permissions: ["payment.read"],
    scope: { countryCode: "ML" },
  };

  assert.deepEqual(
    authorize({
      actor: customer,
      permission: "payment.read",
      environment: "DEMO",
      resourceOwnerId: "customer-2",
    }),
    { allowed: false, reason: "OWNER_MISMATCH" },
  );
});
