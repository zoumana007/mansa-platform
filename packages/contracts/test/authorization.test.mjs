import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTOR_TYPES,
  AUTHENTICATION_LEVELS,
  isActorType,
  isAuthenticationLevel,
} from "../dist/index.js";

test("reconnaît les types d'acteurs autorisés", () => {
  for (const actorType of ACTOR_TYPES) {
    assert.equal(isActorType(actorType), true);
  }

  assert.equal(isActorType("UNKNOWN"), false);
  assert.equal(isActorType("user"), false);
});

test("reconnaît les niveaux d'authentification", () => {
  for (const level of AUTHENTICATION_LEVELS) {
    assert.equal(isAuthenticationLevel(level), true);
  }

  assert.equal(isAuthenticationLevel("PASSWORD_ONLY"), false);
  assert.equal(isAuthenticationLevel("multi_factor"), false);
});

test("les catalogues d'autorisation restent sans doublon", () => {
  assert.equal(new Set(ACTOR_TYPES).size, ACTOR_TYPES.length);
  assert.equal(
    new Set(AUTHENTICATION_LEVELS).size,
    AUTHENTICATION_LEVELS.length,
  );
});

test("les niveaux d'authentification sont ordonnés du plus faible au plus fort", () => {
  assert.deepEqual(AUTHENTICATION_LEVELS, [
    "ANONYMOUS",
    "PRIMARY_FACTOR",
    "MULTI_FACTOR",
    "HARDWARE_BOUND",
  ]);
});
