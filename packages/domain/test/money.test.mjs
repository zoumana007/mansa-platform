import assert from "node:assert/strict";
import test from "node:test";

import { Money } from "../dist/index.js";

test("Money additionne deux montants de même devise", () => {
  const total = Money.ofMinor(1500n, "XOF").add(Money.ofMinor(500n, "XOF"));

  assert.deepEqual(total.toJSON(), { minor: "2000", currency: "XOF" });
});

test("Money refuse les opérations entre devises différentes", () => {
  assert.throws(
    () => Money.ofMinor(100n, "XOF").subtract(Money.ofMinor(100n, "EUR")),
    /Currency mismatch/,
  );
});

test("Money sérialise les bigint sans perte de précision", () => {
  const amount = Money.ofMinor(900719925474099312345n, "XOF");
  const restored = Money.fromJSON(amount.toJSON());

  assert.equal(restored.equals(amount), true);
});

test("Money valide le code ISO de la devise", () => {
  assert.throws(() => Money.zero("xof"), /Invalid currency code/);
  assert.throws(() => Money.zero("FCFA"), /Invalid currency code/);
});

test("Money expose correctement le signe et la valeur absolue", () => {
  const negative = Money.ofMinor(-250n, "XOF");

  assert.equal(negative.isNegative(), true);
  assert.equal(negative.isPositive(), false);
  assert.deepEqual(negative.absolute().toJSON(), {
    minor: "250",
    currency: "XOF",
  });
  assert.equal(Money.zero("XOF").isZero(), true);
});
