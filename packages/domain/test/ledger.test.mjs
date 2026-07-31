import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidJournalEntryError,
  JournalEntry,
} from "../dist/index.js";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function createBalancedEntry() {
  return JournalEntry.create({
    id: "entry-1",
    transactionId: "transaction-1",
    idempotencyKey: "payment:transaction-1",
    createdAt,
    lines: [
      {
        accountId: "wallet:user-1",
        side: "DEBIT",
        amountMinor: 10_000n,
        currency: "xof",
      },
      {
        accountId: "wallet:merchant-1",
        side: "CREDIT",
        amountMinor: 10_000n,
        currency: "XOF",
      },
    ],
  });
}

test("JournalEntry crée une écriture équilibrée et normalise la devise", () => {
  const entry = createBalancedEntry();

  assert.equal(entry.currency, "XOF");
  assert.equal(entry.lines.length, 2);
  assert.equal(entry.createdAt.toISOString(), createdAt.toISOString());
  assert.notEqual(entry.createdAt, createdAt);
  assert.equal(Object.isFrozen(entry.lines), true);
});

test("JournalEntry exige les identifiants et la clé d'idempotence", () => {
  assert.throws(
    () =>
      JournalEntry.create({
        id: " ",
        transactionId: "transaction-1",
        idempotencyKey: "payment:transaction-1",
        createdAt,
        lines: [],
      }),
    InvalidJournalEntryError,
  );
});

test("JournalEntry exige au moins deux lignes", () => {
  assert.throws(
    () =>
      JournalEntry.create({
        id: "entry-1",
        transactionId: "transaction-1",
        idempotencyKey: "payment:transaction-1",
        createdAt,
        lines: [
          {
            accountId: "wallet:user-1",
            side: "DEBIT",
            amountMinor: 10_000n,
            currency: "XOF",
          },
        ],
      }),
    /at least two lines/,
  );
});

test("JournalEntry refuse une écriture déséquilibrée", () => {
  assert.throws(
    () =>
      JournalEntry.create({
        id: "entry-1",
        transactionId: "transaction-1",
        idempotencyKey: "payment:transaction-1",
        createdAt,
        lines: [
          {
            accountId: "wallet:user-1",
            side: "DEBIT",
            amountMinor: 10_000n,
            currency: "XOF",
          },
          {
            accountId: "wallet:merchant-1",
            side: "CREDIT",
            amountMinor: 9_900n,
            currency: "XOF",
          },
        ],
      }),
    /must balance/,
  );
});

test("JournalEntry refuse les montants non positifs", () => {
  assert.throws(
    () =>
      JournalEntry.create({
        id: "entry-1",
        transactionId: "transaction-1",
        idempotencyKey: "payment:transaction-1",
        createdAt,
        lines: [
          {
            accountId: "wallet:user-1",
            side: "DEBIT",
            amountMinor: 0n,
            currency: "XOF",
          },
          {
            accountId: "wallet:merchant-1",
            side: "CREDIT",
            amountMinor: 0n,
            currency: "XOF",
          },
        ],
      }),
    /must be positive/,
  );
});

test("JournalEntry refuse le mélange de devises", () => {
  assert.throws(
    () =>
      JournalEntry.create({
        id: "entry-1",
        transactionId: "transaction-1",
        idempotencyKey: "payment:transaction-1",
        createdAt,
        lines: [
          {
            accountId: "wallet:user-1",
            side: "DEBIT",
            amountMinor: 10_000n,
            currency: "XOF",
          },
          {
            accountId: "wallet:merchant-1",
            side: "CREDIT",
            amountMinor: 10_000n,
            currency: "EUR",
          },
        ],
      }),
    /same currency/,
  );
});

test("JournalEntry refuse un côté comptable inconnu à l'exécution", () => {
  assert.throws(
    () =>
      JournalEntry.create({
        id: "entry-1",
        transactionId: "transaction-1",
        idempotencyKey: "payment:transaction-1",
        createdAt,
        lines: [
          {
            accountId: "wallet:user-1",
            side: "DEBIT",
            amountMinor: 10_000n,
            currency: "XOF",
          },
          {
            accountId: "wallet:merchant-1",
            side: "UNKNOWN",
            amountMinor: 10_000n,
            currency: "XOF",
          },
        ],
      }),
    /either DEBIT or CREDIT/,
  );
});
