import assert from "node:assert/strict";
import test from "node:test";

import {
  Money,
  TransferCommand,
  TransferCurrencyMismatchError,
  TransferWalletNotFoundError,
  Wallet,
  createWalletTransferExecutor,
} from "../dist/index.js";

function wallet(id, balanceMinor, currency = "XOF") {
  return Wallet.create({
    id,
    ownerId: `owner-${id}`,
    currency,
    availableBalance: Money.fromMinor(balanceMinor, currency),
    createdAt: new Date("2026-07-31T19:00:00.000Z"),
  });
}

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

function repository(wallets = []) {
  const byId = new Map(wallets.map((item) => [item.id, item]));
  const saved = [];

  return {
    saved,
    async findById(id) {
      return byId.get(id) ?? null;
    },
    async save(item) {
      byId.set(item.id, item);
      saved.push(item.id);
    },
  };
}

test("débite et crédite les wallets dans la même devise", async () => {
  const source = wallet("wallet-a", 10_000);
  const destination = wallet("wallet-b", 1_000);
  const wallets = repository([source, destination]);
  const occurredAt = new Date("2026-07-31T20:00:00.000Z");
  const execute = createWalletTransferExecutor({
    wallets,
    nextTransactionId: () => "transaction-1",
    now: () => occurredAt,
  });

  const result = await execute(command());

  assert.deepEqual(result, { transactionId: "transaction-1" });
  assert.equal(source.availableBalance.minor, 7_500n);
  assert.equal(destination.availableBalance.minor, 3_500n);
  assert.equal(source.updatedAt.toISOString(), occurredAt.toISOString());
  assert.equal(destination.updatedAt.toISOString(), occurredAt.toISOString());
  assert.deepEqual(wallets.saved, ["wallet-a", "wallet-b"]);
});

test("refuse un transfert lorsque le wallet source est introuvable", async () => {
  const wallets = repository([wallet("wallet-b", 1_000)]);
  const execute = createWalletTransferExecutor({
    wallets,
    nextTransactionId: () => "transaction-1",
  });

  await assert.rejects(
    () => execute(command()),
    (error) =>
      error instanceof TransferWalletNotFoundError &&
      error.walletId === "wallet-a",
  );
  assert.deepEqual(wallets.saved, []);
});

test("refuse un transfert lorsque le wallet destination est introuvable", async () => {
  const wallets = repository([wallet("wallet-a", 10_000)]);
  const execute = createWalletTransferExecutor({
    wallets,
    nextTransactionId: () => "transaction-1",
  });

  await assert.rejects(
    () => execute(command()),
    (error) =>
      error instanceof TransferWalletNotFoundError &&
      error.walletId === "wallet-b",
  );
  assert.deepEqual(wallets.saved, []);
});

test("refuse les devises incompatibles avant de modifier les soldes", async () => {
  const source = wallet("wallet-a", 10_000, "XOF");
  const destination = wallet("wallet-b", 1_000, "EUR");
  const wallets = repository([source, destination]);
  const execute = createWalletTransferExecutor({
    wallets,
    nextTransactionId: () => "transaction-1",
  });

  await assert.rejects(
    () => execute(command()),
    TransferCurrencyMismatchError,
  );
  assert.equal(source.availableBalance.minor, 10_000n);
  assert.equal(destination.availableBalance.minor, 1_000n);
  assert.deepEqual(wallets.saved, []);
});

test("propage l’insuffisance de solde sans persister de wallet", async () => {
  const source = wallet("wallet-a", 1_000);
  const destination = wallet("wallet-b", 1_000);
  const wallets = repository([source, destination]);
  const execute = createWalletTransferExecutor({
    wallets,
    nextTransactionId: () => "transaction-1",
  });

  await assert.rejects(() => execute(command()), /Insufficient available balance/);
  assert.equal(source.availableBalance.minor, 1_000n);
  assert.equal(destination.availableBalance.minor, 1_000n);
  assert.deepEqual(wallets.saved, []);
});
