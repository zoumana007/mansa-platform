import type { TransactionEvent } from "./transaction-event.js";
import type { Transaction } from "./transaction.js";

export type TransactionOutboxRecord = Readonly<{
  event: TransactionEvent;
  recordedAt: Date;
}>;

export interface TransactionUnitOfWork {
  saveAndEnqueue(
    transaction: Transaction,
    event: TransactionEvent,
    recordedAt: Date,
  ): Promise<void>;
}

export class InMemoryTransactionUnitOfWork implements TransactionUnitOfWork {
  readonly transactions = new Map<string, Transaction>();
  readonly outbox: TransactionOutboxRecord[] = [];

  async saveAndEnqueue(
    transaction: Transaction,
    event: TransactionEvent,
    recordedAt: Date,
  ): Promise<void> {
    const reference = transaction.current().reference;
    const previousTransaction = this.transactions.get(reference);
    const previousOutboxLength = this.outbox.length;

    try {
      this.transactions.set(reference, transaction);
      this.outbox.push({ event, recordedAt: new Date(recordedAt) });
    } catch (error) {
      if (previousTransaction) {
        this.transactions.set(reference, previousTransaction);
      } else {
        this.transactions.delete(reference);
      }
      this.outbox.length = previousOutboxLength;
      throw error;
    }
  }
}
