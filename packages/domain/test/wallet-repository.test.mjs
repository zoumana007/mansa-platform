import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryWalletRepository,
  Money,
  Wallet,
} from "../dist/index.js";

function wallet(id, ownerId, currency = "XOF") {
  return Wallet.create({
    id,
    ownerId,
    currency,
    createdAt: new Date("2026-07-31T12:00:00.000Z"),
  });
}

test("enregistre et retrouve un wallet par identifiant", async () => {
  const repository = new InMemoryWalletRepository();
  const item = wallet("wallet-1", "user-1");

  await repository.save(item);

  assert.equal(await repository.findById("wallet-1"), item);
  assert.equal(await repository.findById("missing"), null);
});

test("liste les wallets d’un propriétaire", async () => {
  const repository = new InMemoryWalletRepository();
  await repository.save(wallet("wallet-1", "user-1"));
  await repository.save(wallet("wallet-2", "user-1", "EUR"));
  await repository.save(wallet("wallet-3", "user-2"));

  const results = await repository.findByOwnerId("user-1");

  assert.deepEqual(
    results.map((item) => item.id).sort(),
    ["wallet-1", "wallet-2"],
  );
});

test("filtre les wallets par propriétaire, devise et statut", async () => {
  const repository = new InMemoryWalletRepository();
  const active = wallet("wallet-1", "user-1");
  const suspended = wallet("wallet-2", "user-1");
  suspended.suspend(new Date("2026-07-31T12:01:00.000Z"));
  const foreign = wallet("wallet-3", "user-1", "EUR");

  await repository.save(active);
  await repository.save(suspended);
  await repository.save(foreign);

  const results = await repository.search({
    ownerId: "user-1",
    currency: "XOF",
    status: "SUSPENDED",
  });

  assert.deepEqual(results.map((item) => item.id), ["wallet-2"]);
});

test("remplace la version enregistrée du même wallet", async () => {
  const repository = new InMemoryWalletRepository();
  const item = wallet("wallet-1", "user-1");
  await repository.save(item);

  item.credit(Money.ofMinor(1_000n, "XOF"));
  await repository.save(item);

  const stored = await repository.findById("wallet-1");
  assert.equal(stored?.availableBalance.minor, 1_000n);
});
