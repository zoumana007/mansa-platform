import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTransferCommandError,
  Money,
  TransferCommand,
} from "../dist/index.js";

test("crée une commande de transfert immuable et sérialisable", () => {
  const command = TransferCommand.create({
    transferId: " transfer-1 ",
    sourceWalletId: " wallet-source ",
    destinationWalletId: " wallet-destination ",
    amount: Money.ofMinor(25_000n, "XOF"),
    idempotencyKey: " idem-1 ",
    reference: " Facture 42 ",
  });

  assert.deepEqual(command.toJSON(), {
    transferId: "transfer-1",
    sourceWalletId: "wallet-source",
    destinationWalletId: "wallet-destination",
    amount: { minor: "25000", currency: "XOF" },
    idempotencyKey: "idem-1",
    reference: "Facture 42",
  });
});

test("refuse un transfert vers le même wallet", () => {
  assert.throws(
    () =>
      TransferCommand.create({
        transferId: "transfer-2",
        sourceWalletId: "wallet-1",
        destinationWalletId: "wallet-1",
        amount: Money.ofMinor(1_000n, "XOF"),
        idempotencyKey: "idem-2",
      }),
    InvalidTransferCommandError,
  );
});

test("refuse un montant nul ou négatif", () => {
  for (const minor of [0n, -1n]) {
    assert.throws(
      () =>
        TransferCommand.create({
          transferId: `transfer-${minor}`,
          sourceWalletId: "wallet-1",
          destinationWalletId: "wallet-2",
          amount: Money.ofMinor(minor, "XOF"),
          idempotencyKey: `idem-${minor}`,
        }),
      InvalidTransferCommandError,
    );
  }
});

test("refuse les identifiants et références vides", () => {
  assert.throws(
    () =>
      TransferCommand.create({
        transferId: " ",
        sourceWalletId: "wallet-1",
        destinationWalletId: "wallet-2",
        amount: Money.ofMinor(500n, "XOF"),
        idempotencyKey: "idem-3",
      }),
    InvalidTransferCommandError,
  );

  assert.throws(
    () =>
      TransferCommand.create({
        transferId: "transfer-4",
        sourceWalletId: "wallet-1",
        destinationWalletId: "wallet-2",
        amount: Money.ofMinor(500n, "XOF"),
        idempotencyKey: "idem-4",
        reference: "   ",
      }),
    InvalidTransferCommandError,
  );
});
