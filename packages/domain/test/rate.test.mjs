import assert from "node:assert/strict";
import test from "node:test";

import { Money, Rate } from "../dist/index.js";

test("Rate applique un pourcentage en points de base", () => {
  const fee = Rate.ofBasisPoints(250n).applyTo(Money.ofMinor(10_000n, "XOF"));

  assert.deepEqual(fee.toJSON(), { minor: "250", currency: "XOF" });
});

test("Rate arrondit au plus proche, à l'écart de zéro", () => {
  const rate = Rate.ofBasisPoints(50n);

  assert.equal(rate.applyTo(Money.ofMinor(100n, "XOF")).minor, 1n);
  assert.equal(rate.applyTo(Money.ofMinor(-100n, "XOF")).minor, -1n);
});

test("Rate accepte les bornes zéro et cent pour cent", () => {
  const amount = Money.ofMinor(4_200n, "XOF");

  assert.equal(Rate.zero().applyTo(amount).minor, 0n);
  assert.equal(Rate.ofBasisPoints(10_000n).applyTo(amount).minor, 4_200n);
});

test("Rate refuse les taux hors limites", () => {
  assert.throws(() => Rate.ofBasisPoints(-1n), /between 0 and 10000/);
  assert.throws(() => Rate.ofBasisPoints(10_001n), /between 0 and 10000/);
});

test("Rate sérialise sans nombre flottant", () => {
  const rate = Rate.ofBasisPoints(175n);
  const restored = Rate.fromJSON(rate.toJSON());

  assert.equal(restored.equals(rate), true);
  assert.equal(restored.complement().basisPoints, 9_825n);
});
