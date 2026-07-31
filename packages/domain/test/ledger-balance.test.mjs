import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidLedgerBalanceError,
  calculateLedgerBalance,
} from "../dist/index.js";

const lines = [
  { accountId: "cash", side: "DEBIT", amountMinor: 10_000n, currency: "XOF" },
  { accountId: "cash", side: "CREDIT", amountMinor: 2_500n, currency: "XOF" },
  { accountId: "revenue", side: "CREDIT", amountMinor: 7_500n, currency: "XOF" },
];

test("calcule un solde débiteur pour un actif", () => {
  const balance = calculateLedgerBalance("cash", "ASSET", lines);

  assert.deepEqual(balance, {
    debitMinor: 10_000n,
    creditMinor: 2_500n,
    balanceMinor: 7_500n,
  });
});

test("calcule un solde créditeur pour un produit", () => {
  const balance = calculateLedgerBalance("revenue", "REVENUE", lines);

  assert.deepEqual(balance, {
    debitMinor: 0n,
    creditMinor: 7_500n,
    balanceMinor: 7_500n,
  });
});

test("ignore les lignes des autres comptes", () => {
  const balance = calculateLedgerBalance("unknown", "ASSET", lines);

  assert.equal(balance.balanceMinor, 0n);
});

test("refuse un identifiant de compte vide", () => {
  assert.throws(
    () => calculateLedgerBalance(" ", "ASSET", lines),
    InvalidLedgerBalanceError,
  );
});

test("refuse les montants non positifs du compte ciblé", () => {
  assert.throws(
    () =>
      calculateLedgerBalance("cash", "ASSET", [
        { accountId: "cash", side: "DEBIT", amountMinor: 0n, currency: "XOF" },
      ]),
    /amountMinor must be positive/,
  );
});
