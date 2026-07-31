import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidIdempotencyRecordError,
  createIdempotencyRecord,
  decideIdempotency,
} from "../dist/index.js";

const now = new Date("2026-07-31T06:00:00.000Z");

test("accepte une clé inconnue", () => {
  assert.deepEqual(decideIdempotency("pay-1", "hash-a", undefined, now), {
    kind: "ACCEPT",
  });
});

test("rejoue une réponse terminée pour la même requête", () => {
  const record = createIdempotencyRecord({
    key: "pay-1",
    requestHash: "hash-a",
    responseReference: "payment-42",
    expiresAt: new Date("2026-08-01T06:00:00.000Z"),
  });

  assert.deepEqual(decideIdempotency("pay-1", "hash-a", record, now), {
    kind: "REPLAY",
    responseReference: "payment-42",
  });
});

test("signale un conflit si la même clé protège une autre requête", () => {
  const record = createIdempotencyRecord({
    key: "pay-1",
    requestHash: "hash-a",
    responseReference: "payment-42",
    expiresAt: new Date("2026-08-01T06:00:00.000Z"),
  });

  assert.deepEqual(decideIdempotency("pay-1", "hash-b", record, now), {
    kind: "CONFLICT",
  });
});

test("signale un conflit tant que la première requête est en cours", () => {
  const record = createIdempotencyRecord({
    key: "pay-1",
    requestHash: "hash-a",
    expiresAt: new Date("2026-08-01T06:00:00.000Z"),
  });

  assert.deepEqual(decideIdempotency("pay-1", "hash-a", record, now), {
    kind: "CONFLICT",
  });
});

test("accepte une clé expirée", () => {
  const record = createIdempotencyRecord({
    key: "pay-1",
    requestHash: "hash-a",
    responseReference: "payment-42",
    expiresAt: new Date("2026-07-31T05:59:59.999Z"),
  });

  assert.deepEqual(decideIdempotency("pay-1", "hash-b", record, now), {
    kind: "ACCEPT",
  });
});

test("refuse les données d’idempotence invalides", () => {
  assert.throws(
    () =>
      createIdempotencyRecord({
        key: " ",
        requestHash: "hash-a",
        expiresAt: new Date("2026-08-01T06:00:00.000Z"),
      }),
    InvalidIdempotencyRecordError,
  );

  assert.throws(
    () => decideIdempotency("pay-1", "hash-a", undefined, new Date("invalid")),
    /now must be a valid date/,
  );
});
