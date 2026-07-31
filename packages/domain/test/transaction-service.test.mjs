import assert from "node:assert/strict";
import test from "node:test";

import {
  Money,
  TransactionAlreadyExistsError,
  TransactionNotFoundError,
  TransactionService,
} from "../dist/index.js";

const reference = "MNSA-ML-20260731-ABCDEF123456";

function createHarness() {
  const transactions = new Map();
  const events = [];
  let sequence = 0;
  const times = [
    new Date("2026-07-31T12:00:00.000Z"),
    new Date("2026-07-31T12:01:00.000Z"),
  ];

  const service = new TransactionService({
    repository: {
      async findByReference(value) {
        return transactions.get(value.trim().toUpperCase()) ?? null;
      },
      async save(transaction) {
        transactions.set(transaction.current().reference, transaction);
      },
    },
    publisher: {
      async publish(event) {
        events.push(event);
      },
    },
    createEventId: () => `evt-${++sequence}`,
    now: () => times.shift() ?? new Date("2026-07-31T12:02:00.000Z"),
  });

  return { service, transactions, events };
}

test("crée, persiste et publie une transaction", async () => {
  const { service, transactions, events } = createHarness();

  const transaction = await service.create({
    reference: reference.toLowerCase(),
    kind: "PAYMENT",
    amount: Money.ofMinor(5_000n, "XOF"),
  });

  assert.equal(transaction.current().state, "PENDING");
  assert.equal(transactions.has(reference), true);
  assert.equal(events.length, 1);
  assert.equal(events[0].name, "TRANSACTION_CREATED");
  assert.equal(events[0].transactionReference, reference);
});

test("refuse une référence déjà utilisée", async () => {
  const { service } = createHarness();
  const input = {
    reference,
    kind: "TRANSFER",
    amount: Money.ofMinor(10_000n, "XOF"),
  };

  await service.create(input);
  await assert.rejects(() => service.create(input), TransactionAlreadyExistsError);
});

test("fait évoluer une transaction et publie le changement", async () => {
  const { service, events } = createHarness();

  await service.create({
    reference,
    kind: "CASH_IN",
    amount: Money.ofMinor(2_500n, "XOF"),
  });
  const transaction = await service.transition({
    reference,
    to: "PROCESSING",
  });

  assert.equal(transaction.current().state, "PROCESSING");
  assert.equal(events.length, 2);
  assert.equal(events[1].name, "TRANSACTION_STATE_CHANGED");
  assert.deepEqual(events[1].payload, {
    from: "PENDING",
    to: "PROCESSING",
  });
});

test("signale une transaction absente", async () => {
  const { service } = createHarness();

  await assert.rejects(
    () => service.transition({ reference, to: "FAILED" }),
    TransactionNotFoundError,
  );
});
