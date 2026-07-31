import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransferExecutionError,
  Money,
  TransferCommand,
  TransferIdentityConflictError,
  TransferResult,
  TransferService,
} from "../dist/index.js";

function command(overrides = {}) {
  return TransferCommand.create({
    transferId: "transfer-1",
    sourceWalletId: "wallet-a",
    destinationWalletId: "wallet-b",
    amount: Money.fromMinor(2500, "XOF"),
    idempotencyKey: "idem-1",
    ...overrides,
  });
}

function repository(initial = {}) {
  const saved = [];
  return {
    saved,
    async findByTransferId(id) {
      return initial.byTransferId?.get(id) ?? null;
    },
    async findByIdempotencyKey(key) {
      return initial.byIdempotencyKey?.get(key) ?? null;
    },
    async saveCompleted(input) {
      saved.push(input);
    },
  };
}

test("exécute et enregistre un nouveau transfert", async () => {
  const repo = repository();
  let executions = 0;
  const service = new TransferService({
    repository: repo,
    now: () => new Date("2026-07-31T18:30:00.000Z"),
    executeAtomically: async (received) => {
      executions += 1;
      assert.equal(received.transferId, "transfer-1");
      return { transactionId: "transaction-1" };
    },
  });

  const result = await service.execute(command());

  assert.equal(executions, 1);
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.transactionId, "transaction-1");
  assert.equal(repo.saved.length, 1);
  assert.equal(repo.saved[0].command.transferId, "transfer-1");
});

test("normalise l’identifiant de transaction retourné", async () => {
  const repo = repository();
  const service = new TransferService({
    repository: repo,
    now: () => new Date("2026-07-31T18:30:00.000Z"),
    executeAtomically: async () => ({ transactionId: " transaction-1 " }),
  });

  const result = await service.execute(command());

  assert.equal(result.transactionId, "transaction-1");
  assert.equal(repo.saved[0].result.transactionId, "transaction-1");
});

test("refuse une date de complétion invalide avant toute mutation", async () => {
  const repo = repository();
  let executions = 0;
  const service = new TransferService({
    repository: repo,
    now: () => new Date(Number.NaN),
    executeAtomically: async () => {
      executions += 1;
      return { transactionId: "transaction-1" };
    },
  });

  await assert.rejects(
    () => service.execute(command()),
    InvalidTransferExecutionError,
  );
  assert.equal(executions, 0);
  assert.equal(repo.saved.length, 0);
});

test("refuse un identifiant de transaction vide", async () => {
  const repo = repository();
  const service = new TransferService({
    repository: repo,
    now: () => new Date("2026-07-31T18:30:00.000Z"),
    executeAtomically: async () => ({ transactionId: "   " }),
  });

  await assert.rejects(
    () => service.execute(command()),
    InvalidTransferExecutionError,
  );
  assert.equal(repo.saved.length, 0);
});

test("rejoue un transfert existant sans nouvelle mutation", async () => {
  const completed = TransferResult.completed(
    "transfer-1",
    "transaction-1",
    new Date("2026-07-31T18:00:00.000Z"),
  );
  const repo = repository({
    byTransferId: new Map([["transfer-1", completed]]),
    byIdempotencyKey: new Map([["idem-1", completed]]),
  });
  const service = new TransferService({
    repository: repo,
    executeAtomically: async () => {
      throw new Error("must not execute");
    },
  });

  const result = await service.execute(command());

  assert.equal(result.status, "REPLAYED");
  assert.equal(result.transactionId, "transaction-1");
  assert.equal(repo.saved.length, 0);
});

test("refuse une clé déjà associée à un autre transfert", async () => {
  const completed = TransferResult.completed(
    "transfer-other",
    "transaction-other",
    new Date("2026-07-31T18:00:00.000Z"),
  );
  const repo = repository({
    byIdempotencyKey: new Map([["idem-1", completed]]),
  });
  const service = new TransferService({
    repository: repo,
    executeAtomically: async () => ({ transactionId: "never" }),
  });

  await assert.rejects(
    () => service.execute(command()),
    TransferIdentityConflictError,
  );
});
