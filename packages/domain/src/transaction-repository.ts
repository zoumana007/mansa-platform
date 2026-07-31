import type { Transaction, TransactionSnapshot } from "./transaction.js";

export interface TransactionRepository {
  findByReference(reference: string): Promise<Transaction | null>;
  save(transaction: Transaction): Promise<void>;
}

export interface TransactionReadRepository {
  findSnapshotByReference(reference: string): Promise<TransactionSnapshot | null>;
}
