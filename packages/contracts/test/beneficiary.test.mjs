import assert from "node:assert/strict";
import test from "node:test";

import {
  BENEFICIARY_STATUSES,
  BENEFICIARY_TYPES,
  BENEFICIARY_VERIFICATION_METHODS,
  isBeneficiaryStatus,
  isBeneficiaryType,
  isBeneficiaryVerificationMethod,
} from "../dist/beneficiary.js";

test("reconnaît les types de bénéficiaires", () => {
  for (const type of BENEFICIARY_TYPES) {
    assert.equal(isBeneficiaryType(type), true);
  }

  assert.equal(isBeneficiaryType("CRYPTO_WALLET"), false);
});

test("reconnaît les statuts de bénéficiaires", () => {
  for (const status of BENEFICIARY_STATUSES) {
    assert.equal(isBeneficiaryStatus(status), true);
  }

  assert.equal(isBeneficiaryStatus("DELETED"), false);
});

test("reconnaît les méthodes de vérification", () => {
  for (const method of BENEFICIARY_VERIFICATION_METHODS) {
    assert.equal(isBeneficiaryVerificationMethod(method), true);
  }

  assert.equal(isBeneficiaryVerificationMethod("NONE"), false);
});

test("les catalogues bénéficiaires restent sans doublon", () => {
  assert.equal(new Set(BENEFICIARY_TYPES).size, BENEFICIARY_TYPES.length);
  assert.equal(new Set(BENEFICIARY_STATUSES).size, BENEFICIARY_STATUSES.length);
  assert.equal(
    new Set(BENEFICIARY_VERIFICATION_METHODS).size,
    BENEFICIARY_VERIFICATION_METHODS.length,
  );
});
