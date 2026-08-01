import assert from "node:assert/strict";
import test from "node:test";

import {
  SORT_DIRECTIONS,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_HISTORY_SORT_FIELDS,
  isSortDirection,
  isTransactionDirection,
  isTransactionHistorySortField,
} from "../dist/transaction-history.js";

test("reconnaît les directions de transaction", () => {
  for (const direction of TRANSACTION_DIRECTIONS) {
    assert.equal(isTransactionDirection(direction), true);
  }

  assert.equal(isTransactionDirection("REVERSAL"), false);
});

test("reconnaît les champs de tri de l’historique", () => {
  for (const field of TRANSACTION_HISTORY_SORT_FIELDS) {
    assert.equal(isTransactionHistorySortField(field), true);
  }

  assert.equal(isTransactionHistorySortField("STATUS"), false);
});

test("reconnaît les directions de tri", () => {
  for (const direction of SORT_DIRECTIONS) {
    assert.equal(isSortDirection(direction), true);
  }

  assert.equal(isSortDirection("LATEST"), false);
});

test("les catalogues de l’historique restent sans doublon", () => {
  assert.equal(new Set(TRANSACTION_DIRECTIONS).size, TRANSACTION_DIRECTIONS.length);
  assert.equal(
    new Set(TRANSACTION_HISTORY_SORT_FIELDS).size,
    TRANSACTION_HISTORY_SORT_FIELDS.length,
  );
  assert.equal(new Set(SORT_DIRECTIONS).size, SORT_DIRECTIONS.length);
});
