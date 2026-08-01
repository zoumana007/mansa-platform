import assert from "node:assert/strict";
import test from "node:test";

import { MerchantLocation } from "../dist/index.js";

function location(overrides = {}) {
  return new MerchantLocation({
    id: "location_001",
    merchantId: "merchant_001",
    name: "Boutique ACI 2000",
    countryCode: "ML",
    city: "Bamako",
    addressLine: "ACI 2000, Hamdallaye",
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    ...overrides,
  });
}

test("crée puis active un point de vente", () => {
  const point = location();
  assert.equal(point.status, "draft");
  assert.equal(point.canOperate(), false);
  point.activate();
  assert.equal(point.canOperate(), true);
});

test("met à jour les informations tant que le point n'est pas fermé", () => {
  const point = location();
  point.updateDetails({ name: "Boutique Centre", city: "Kati" });
  assert.equal(point.name, "Boutique Centre");
  assert.equal(point.city, "Kati");
});

test("suspend et réactive un point de vente avec motif", () => {
  const point = location();
  point.activate();
  point.suspend("Contrôle conformité");
  assert.equal(point.status, "suspended");
  assert.equal(point.statusReason, "Contrôle conformité");
  assert.equal(point.canOperate(), false);
  point.activate();
  assert.equal(point.statusReason, null);
});

test("ferme définitivement un point de vente", () => {
  const point = location();
  point.close("Fermeture définitive");
  assert.equal(point.status, "closed");
  assert.throws(() => point.updateDetails({ city: "Ségou" }), /closed/);
  assert.throws(() => point.activate(), /draft or suspended/);
});

test("valide les champs obligatoires et le code pays", () => {
  assert.throws(() => location({ name: " " }), /name is required/);
  assert.throws(() => location({ countryCode: "Mali" }), /ISO 3166-1 alpha-2/);
  assert.equal(location({ countryCode: "ml" }).countryCode, "ML");
});

test("sérialise les données publiques du point de vente", () => {
  assert.deepEqual(location().toJSON(), {
    id: "location_001",
    merchantId: "merchant_001",
    name: "Boutique ACI 2000",
    countryCode: "ML",
    city: "Bamako",
    addressLine: "ACI 2000, Hamdallaye",
    status: "draft",
    statusReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
  });
});
