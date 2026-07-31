import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryTransactionUnitOfWork,
  Money,
  Transaction,
  transactionCreatedEvent,
} from "../dist/index.js";

const reference = "MNSA-ML-20260731-OUTBOX000001";

test("enregistre atomiquement la transaction et son événement", async () => {
  const unitOfWork = new InMemoryTransactionUnitOfWork();
  const now = new Date("2026-07-31T13:00:00.000Z");
  const transaction = Transaction.create({
    reference,
    kind: "PAYMENT",
    amount: Money.ofMinor(7_500n, "XOF"),
    now,
  });
  const event = transactionCreatedEvent({
    id: "evt-outbox-1",
    transactionReference: reference,
    transactionKind: "PAYMENT",
    occurredAt: now,
  });

  await unitOfWork.saveAndEnqueue(transaction, event, now);

  assert.equal(unitOfWork.transactions.get(reference), transaction);
  assert.equal(unitOfWork.outbox.length, 1);
  assert.equal(unitOfWork.outbox[0].event, event);
  assert.notEqual(unitOfWork.outbox[0].recordedAt, now);
  assert.equal(unitOfWork.outbox[0].recordedAt.toISOString(), now.toISOString());
});

test("conserve l’ordre d’enregistrement des événements", async () => {
  const unitOfWork = new InMemoryTransactionUnitOfWork();

  for (let index = 1; index <= 2; index += 1) {
    const currentReference = `${reference.slice(0, -1)}${index}`;
    const now = new Date(`2026-07-31T13:0${index}:00.000Z`);
    const transaction = Transaction.create({
      reference: currentReference,
      kind: "TRANSFER",
      amount: Money.ofMinor(BigInt(index * 1_000), "XOF"),
      now,
    });
    const event = transactionCreatedEvent({
      id: `evt-outbox-${index}`,
      transactionReference: currentReference,
      transactionKind: "TRANSFER",
      occurredAt: now,
    });

    await unitOfWork.saveAndEnqueue(transaction, event, now);
  }

  assert.deepEqual(
    unitOfWork.outbox.map(({ event }) => event.id),
    ["evt-outbox-1", "evt-outbox-2"],
  );
});
