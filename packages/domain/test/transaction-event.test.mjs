import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransactionEventError,
  transactionCreatedEvent,
  transactionStateChangedEvent,
} from "../dist/index.js";

const reference = "MNSA-ML-20260731-ABCDEF123456";

test("crée un événement de création immuable", () => {
  const occurredAt = new Date("2026-07-31T10:30:00.000Z");
  const event = transactionCreatedEvent({
    id: "evt-001",
    transactionReference: reference.toLowerCase(),
    transactionKind: "PAYMENT",
    occurredAt,
  });

  occurredAt.setUTCFullYear(2000);

  assert.equal(event.name, "TRANSACTION_CREATED");
  assert.equal(event.transactionReference, reference);
  assert.equal(event.payload.state, "PENDING");
  assert.equal(event.occurredAt.getUTCFullYear(), 2026);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.payload), true);
});

test("décrit un changement d’état", () => {
  const event = transactionStateChangedEvent({
    id: "evt-002",
    transactionReference: reference,
    transactionKind: "TRANSFER",
    from: "PENDING",
    to: "PROCESSING",
    occurredAt: new Date("2026-07-31T10:31:00.000Z"),
  });

  assert.equal(event.name, "TRANSACTION_STATE_CHANGED");
  assert.deepEqual(event.payload, {
    from: "PENDING",
    to: "PROCESSING",
  });
});

test("refuse les identifiants vides et les transitions sans changement", () => {
  assert.throws(
    () =>
      transactionCreatedEvent({
        id: " ",
        transactionReference: reference,
        transactionKind: "CASH_IN",
        occurredAt: new Date(),
      }),
    InvalidTransactionEventError,
  );

  assert.throws(
    () =>
      transactionStateChangedEvent({
        id: "evt-003",
        transactionReference: reference,
        transactionKind: "REFUND",
        from: "FAILED",
        to: "FAILED",
        occurredAt: new Date(),
      }),
    InvalidTransactionEventError,
  );
});
