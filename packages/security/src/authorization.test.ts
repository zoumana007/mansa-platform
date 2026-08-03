import assert from "node:assert/strict";
import test from "node:test";

import {
  authorize,
  type AuthorizationActor,
  type AuthorizationRequest,
} from "./index.js";

const actor: AuthorizationActor = {
  actorId: "actor-1",
  roles: ["MERCHANT_MANAGER"],
  permissions: ["payment.read", "payment.refund"],
  scope: {
    countryCode: "ML",
    organizationId: "org-1",
    merchantId: "merchant-1",
    storeId: "store-1",
  },
};

function request(
  overrides: Partial<AuthorizationRequest> = {},
): AuthorizationRequest {
  return {
    permission: "payment.read",
    environment: "DEMO",
    actor,
    ...overrides,
  };
}

test("autorise une permission présente dans le bon périmètre", () => {
  assert.deepEqual(
    authorize(
      request({
        resourceScope: {
          countryCode: "ML",
          merchantId: "merchant-1",
          storeId: "store-1",
        },
      }),
    ),
    { allowed: true, reason: "AUTHORIZED" },
  );
});

test("refuse une permission absente", () => {
  assert.deepEqual(authorize(request({ permission: "payment.create" })), {
    allowed: false,
    reason: "MISSING_PERMISSION",
  });
});

test("refuse une ressource située hors du périmètre de l’acteur", () => {
  assert.deepEqual(
    authorize(
      request({
        resourceScope: {
          countryCode: "ML",
          merchantId: "merchant-2",
        },
      }),
    ),
    { allowed: false, reason: "SCOPE_MISMATCH" },
  );
});

test("refuse à un client l’accès à la ressource d’un tiers", () => {
  assert.deepEqual(
    authorize(
      request({
        actor: {
          actorId: "customer-1",
          roles: ["CUSTOMER"],
          permissions: ["payment.read"],
          scope: { countryCode: "ML" },
        },
        resourceOwnerId: "customer-2",
      }),
    ),
    { allowed: false, reason: "OWNER_MISMATCH" },
  );
});

test("autorise un client à consulter sa propre ressource", () => {
  assert.deepEqual(
    authorize(
      request({
        actor: {
          actorId: "customer-1",
          roles: ["CUSTOMER"],
          permissions: ["payment.read"],
          scope: { countryCode: "ML" },
        },
        resourceOwnerId: "customer-1",
      }),
    ),
    { allowed: true, reason: "AUTHORIZED" },
  );
});

test("exige un approbateur distinct pour une action à double validation", () => {
  assert.deepEqual(
    authorize(
      request({
        permission: "payment.refund",
        requiresDualApproval: true,
      }),
    ),
    { allowed: false, reason: "DUAL_APPROVAL_REQUIRED" },
  );

  assert.deepEqual(
    authorize(
      request({
        permission: "payment.refund",
        requiresDualApproval: true,
        approverActorId: "actor-1",
      }),
    ),
    { allowed: false, reason: "SELF_APPROVAL_FORBIDDEN" },
  );

  assert.deepEqual(
    authorize(
      request({
        permission: "payment.refund",
        requiresDualApproval: true,
        approverActorId: "actor-2",
      }),
    ),
    { allowed: true, reason: "AUTHORIZED" },
  );
});
