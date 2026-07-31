import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryWalletRepository,
  Money,
  WalletAlreadyExistsError,
  WalletNotFoundError,
  WalletService,
} from "../dist/index.js";

function createClock(...timestamps) {
  let index = 0;
  return () => {
    const value = timestamps[Math.min(index, timestamps.length - 1)];
    index += 1;
    return new Date(value);
  };
}

test("crée puis persiste un wallet", async () => {
  const repository = new InMemoryWalletRepository();
  const service = new WalletService({
    repository,
    now: createClock("2026-07-31T14:00:00.000Z"),
  });

  const wallet = await service.create({
    id: "wallet-service-1",
    ownerId: "user-1",
    currency: "XOF",
  });

  assert.equal(wallet.availableBalance.minor, 0n);
  assert.equal(
    (await repository.findById("wallet-service-1"))?.id,
    "wallet-service-1",
  );
});

test("refuse la création d'un identifiant déjà utilisé", async () => {
  const repository = new InMemoryWalletRepository();
  const service = new WalletService({ repository });
  const input = {
    id: "wallet-duplicate",
    ownerId: "user-1",
    currency: "XOF",
  };

  await service.create(input);

  await assert.rejects(
    () => service.create(input),
    WalletAlreadyExistsError,
  );
});

test("orchestre crédit, débit et suspension", async () => {
  const repository = new InMemoryWalletRepository();
  const service = new WalletService({
    repository,
    now: createClock(
      "2026-07-31T14:00:00.000Z",
      "2026-07-31T14:01:00.000Z",
      "2026-07-31T14:02:00.000Z",
      "2026-07-31T14:03:00.000Z",
    ),
  });

  await service.create({
    id: "wallet-operations",
    ownerId: "user-1",
    currency: "XOF",
  });
  await service.credit({
    walletId: "wallet-operations",
    amount: Money.ofMinor(10_000n, "XOF"),
  });
  const wallet = await service.debit({
    walletId: "wallet-operations",
    amount: Money.ofMinor(2_500n, "XOF"),
  });
  await service.suspend("wallet-operations");

  assert.equal(wallet.availableBalance.minor, 7_500n);
  assert.equal(wallet.status, "SUSPENDED");
});

test("signale un wallet absent sans créer de mutation", async () => {
  const service = new WalletService({
    repository: new InMemoryWalletRepository(),
  });

  await assert.rejects(
    () =>
      service.credit({
        walletId: "wallet-missing",
        amount: Money.ofMinor(500n, "XOF"),
      }),
    WalletNotFoundError,
  );
});
