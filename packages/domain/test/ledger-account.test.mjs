import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidLedgerAccountError,
  LedgerAccount,
} from "../dist/index.js";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function createAccount(overrides = {}) {
  return LedgerAccount.create({
    id: "account-1",
    code: "wallet:user-1",
    name: "Wallet principal",
    type: "LIABILITY",
    currency: "xof",
    createdAt,
    ...overrides,
  });
}

test("LedgerAccount normalise les champs canoniques", () => {
  const account = createAccount({ ownerReference: " user-1 " });

  assert.equal(account.code, "WALLET:USER-1");
  assert.equal(account.currency, "XOF");
  assert.equal(account.status, "ACTIVE");
  assert.equal(account.ownerReference, "user-1");
  assert.equal(account.canPost(), true);
  assert.notEqual(account.createdAt, createdAt);
});

test("LedgerAccount refuse les champs obligatoires vides", () => {
  assert.throws(() => createAccount({ id: " " }), InvalidLedgerAccountError);
  assert.throws(() => createAccount({ code: " " }), InvalidLedgerAccountError);
  assert.throws(() => createAccount({ name: " " }), InvalidLedgerAccountError);
});

test("LedgerAccount refuse un code non canonique", () => {
  assert.throws(
    () => createAccount({ code: "wallet utilisateur" }),
    /code must contain/,
  );
});

test("LedgerAccount refuse un type inconnu à l'exécution", () => {
  assert.throws(
    () => createAccount({ type: "UNKNOWN" }),
    /unsupported account type/,
  );
});

test("LedgerAccount refuse un statut inconnu à l'exécution", () => {
  assert.throws(
    () => createAccount({ status: "UNKNOWN" }),
    /unsupported account status/,
  );
});

test("LedgerAccount refuse une devise non ISO 4217", () => {
  assert.throws(() => createAccount({ currency: "FCFA" }), /ISO 4217/);
});

test("LedgerAccount refuse une date invalide", () => {
  assert.throws(
    () => createAccount({ createdAt: new Date("invalid") }),
    /valid date/,
  );
});

test("LedgerAccount interdit les écritures sur un compte gelé ou fermé", () => {
  assert.equal(createAccount({ status: "FROZEN" }).canPost(), false);
  assert.equal(createAccount({ status: "CLOSED" }).canPost(), false);
});
