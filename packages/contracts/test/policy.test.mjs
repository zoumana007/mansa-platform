import assert from "node:assert/strict";
import test from "node:test";

import {
  POLICY_CONDITION_OPERATORS,
  POLICY_EFFECTS,
  POLICY_STATUSES,
  isPolicyConditionOperator,
  isPolicyEffect,
  isPolicyStatus,
} from "../dist/index.js";

test("reconnaît les effets de politique", () => {
  for (const effect of POLICY_EFFECTS) {
    assert.equal(isPolicyEffect(effect), true);
  }

  assert.equal(isPolicyEffect("PERMIT"), false);
});

test("reconnaît les statuts de politique", () => {
  for (const status of POLICY_STATUSES) {
    assert.equal(isPolicyStatus(status), true);
  }

  assert.equal(isPolicyStatus("DELETED"), false);
});

test("reconnaît les opérateurs de condition", () => {
  for (const operator of POLICY_CONDITION_OPERATORS) {
    assert.equal(isPolicyConditionOperator(operator), true);
  }

  assert.equal(isPolicyConditionOperator("CONTAINS"), false);
});

test("les catalogues de politiques restent sans doublon", () => {
  assert.equal(new Set(POLICY_EFFECTS).size, POLICY_EFFECTS.length);
  assert.equal(new Set(POLICY_STATUSES).size, POLICY_STATUSES.length);
  assert.equal(
    new Set(POLICY_CONDITION_OPERATORS).size,
    POLICY_CONDITION_OPERATORS.length,
  );
});
