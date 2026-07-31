import assert from "node:assert/strict";
import test from "node:test";

import { InvalidMansaHandleError, MansaHandle } from "../dist/index.js";

test("normalise et sérialise un identifiant Mansa", () => {
  const handle = MansaHandle.create("  @Camara.007  ");

  assert.equal(handle.value, "camara.007");
  assert.equal(handle.toString(), "@camara.007");
  assert.deepEqual(handle.toJSON(), {
    value: "camara.007",
    display: "@camara.007",
  });
});

test("compare les identifiants après normalisation", () => {
  assert.equal(
    MansaHandle.create("@Zoumana").equals(MansaHandle.create(" zoumana ")),
    true,
  );
});

test("refuse les caractères et séparateurs invalides", () => {
  for (const value of ["zou mana", "_zoumana", "zoumana-", "zoumana@007"]) {
    assert.throws(() => MansaHandle.create(value), InvalidMansaHandleError);
  }
});

test("refuse les identifiants réservés", () => {
  assert.throws(
    () => MansaHandle.create("@Support"),
    InvalidMansaHandleError,
  );

  assert.throws(
    () =>
      MansaHandle.create("partenaire", {
        reserved: new Set(["PARTENAIRE"]),
      }),
    InvalidMansaHandleError,
  );
});

test("applique une politique de longueur configurable", () => {
  assert.throws(
    () => MansaHandle.create("ab", { minLength: 3 }),
    InvalidMansaHandleError,
  );

  assert.throws(
    () => MansaHandle.create("abcdef", { maxLength: 5 }),
    InvalidMansaHandleError,
  );
});

test("refuse une politique incohérente", () => {
  assert.throws(
    () => MansaHandle.create("zoumana", { minLength: 0 }),
    InvalidMansaHandleError,
  );

  assert.throws(
    () => MansaHandle.create("zoumana", { minLength: 8, maxLength: 4 }),
    InvalidMansaHandleError,
  );
});
