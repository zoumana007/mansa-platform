import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransactionReferenceError,
  createTransactionReference,
  isTransactionReference,
  parseTransactionReference,
} from "../dist/index.js";

test("crée et normalise une référence", () => {
  assert.equal(
    createTransactionReference({ countryCode: "ml", businessDate: "20260731", uniquePart: "a1b2c3d4e5f6" }),
    "MNSA-ML-20260731-A1B2C3D4E5F6",
  );
});

test("analyse une référence valide", () => {
  assert.deepEqual(parseTransactionReference("mnsa-ml-20260731-a1b2c3d4e5f6"), {
    countryCode: "ML",
    businessDate: "20260731",
    uniquePart: "A1B2C3D4E5F6",
  });
});

test("valide le format et le calendrier", () => {
  assert.equal(isTransactionReference("MNSA-SN-20260228-0123456789AB"), true);
  assert.equal(isTransactionReference("MNSA-SN-20260230-0123456789AB"), false);
  assert.equal(isTransactionReference("reference-invalide"), false);
});

test("refuse les composants invalides", () => {
  assert.throws(
    () => createTransactionReference({ countryCode: "MLI", businessDate: "20260731", uniquePart: "A1B2C3D4E5F6" }),
    InvalidTransactionReferenceError,
  );
  assert.throws(
    () => createTransactionReference({ countryCode: "ML", businessDate: "20260230", uniquePart: "A1B2C3D4E5F6" }),
    /valid calendar date/,
  );
});
