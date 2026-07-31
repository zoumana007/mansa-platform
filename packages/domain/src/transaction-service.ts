import type { Money } from "./money.js";
import {
  transactionCreatedEvent,
  transactionStateChangedEvent,
  type TransactionEvent,
} from "./transaction-event.js";
import type { TransactionEventPublisher } from "./transaction-event-publisher.js";
import type { TransactionRepository } from "./transaction-repository.js";
import type { TransactionState } from "./transaction-state.js";
import { Transaction, type TransactionKind } from "./transaction.js";

export class TransactionAlreadyExistsError extends Error {
  constructor(public readonly reference: string) {
    super(`transaction already exists: ${reference}`);
    this.name = "TransactionAlreadyExistsError";
  }
}

export class TransactionNotFoundError extends Error {
  constructor(public readonly reference: string) {
    super(`transaction not found: ${reference}`);
    this.name = "TransactionNotFoundError";
  }
}

export type TransactionServiceDependencies = Readonly<{
  repository: TransactionRepository;
  publisher: TransactionEventPublisher;
  createEventId: () => string;
  now?: () => Date;
}>;

export class TransactionService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: TransactionServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async create(input: {
    reference: string;
    kind: TransactionKind;
    amount: Money;
  }): Promise<Transaction> {
    const existing = await this.dependencies.repository.findByReference(
      input.reference,
    );

    if (existing) {
      throw new TransactionAlreadyExistsError(input.reference);
    }

    const now = this.now();
    const transaction = Transaction.create({ ...input, now });
    await this.dependencies.repository.save(transaction);

    await this.publish(
      transactionCreatedEvent({
        id: this.dependencies.createEventId(),
        transactionReference: transaction.current().reference,
        transactionKind: transaction.current().kind,
        occurredAt: now,
      }),
    );

    return transaction;
  }

  async transition(input: {
    reference: string;
    to: TransactionState;
  }): Promise<Transaction> {
    const transaction = await this.dependencies.repository.findByReference(
      input.reference,
    );

    if (!transaction) {
      throw new TransactionNotFoundError(input.reference);
    }

    const before = transaction.current();
    const now = this.now();
    transaction.transition(input.to, now);
    await this.dependencies.repository.save(transaction);

    await this.publish(
      transactionStateChangedEvent({
        id: this.dependencies.createEventId(),
        transactionReference: before.reference,
        transactionKind: before.kind,
        from: before.state,
        to: input.to,
        occurredAt: now,
      }),
    );

    return transaction;
  }

  private async publish(event: TransactionEvent): Promise<void> {
    await this.dependencies.publisher.publish(event);
  }
}
