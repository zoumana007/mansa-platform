import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransferResultError,
  TransferResult,
} from "../dist/index.js";

test("crée et sérialise un résultat de transfert terminé", () => {
  const completedAt = new Date("2026-07-31T17:30:00.000Z");
  const result = TransferResult.completed(
    " transfer-1 ",
    " transaction-1 ",
    completedAt,
  );

  assert.deepEqual(result.toJSON(), {
    transferId: "transfer-1",
    transactionId: "transaction-1",
    status: "COMPLETED",
    completedAt: "2026-07-31T17:30:00.000Z",
  });
  assert.notEqual(result.completedAt, completedAt);
});

test("protège la date interne contre les mutations externes", () => {
  const inputDate = new Date("2026-07-31T17:30:00.000Z");
  const result = TransferResult.completed(
    "transfer-immutable",
    "transaction-immutable",
    inputDate,
  );

  inputDate.setUTCFullYear(2040);
  const exposedDate = result.completedAt;
  exposedDate.setUTCFullYear(2050);

  assert.equal(result.completedAt.toISOString(), "2026-07-31T17:30:00.000Z");
  assert.equal(result.toJSON().completedAt, "2026-07-31T17:30:00.000Z");
  assert.notEqual(result.completedAt, exposedDate);
});

test("signale explicitement une réponse rejouée", () => {
  const result = TransferResult.replayed(
    "transfer-2",
    "transaction-2",
    new Date("2026-07-31T17:31:00.000Z"),
  );

  assert.equal(result.status, "REPLAYED");
  assert.equal(result.transactionId, "transaction-2");
});

test("refuse les identifiants vides", () => {
  assert.throws(
    () =>
      TransferResult.completed(
        " ",
        "transaction-3",
        new Date("2026-07-31T17:32:00.000Z"),
      ),
    InvalidTransferResultError,
  );

  assert.throws(
    () =>
      TransferResult.completed(
        "transfer-3",
        " ",
        new Date("2026-07-31T17:32:00.000Z"),
      ),
    InvalidTransferResultError,
  );
});

test("refuse une date ou un statut invalide", () => {
  assert.throws(
    () =>
      TransferResult.create({
        transferId: "transfer-4",
        transactionId: "transaction-4",
        status: "COMPLETED",
        completedAt: new Date("invalid"),
      }),
    InvalidTransferResultError,
  );

  assert.throws(
    () =>
      TransferResult.create({
        transferId: "transfer-5",
        transactionId: "transaction-5",
        status: "FAILED",
        completedAt: new Date("2026-07-31T17:33:00.000Z"),
      }),
    InvalidTransferResultError,
  );
});
