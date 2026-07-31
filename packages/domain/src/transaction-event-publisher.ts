import type { TransactionEvent } from "./transaction-event.js";

export interface TransactionEventPublisher {
  publish(event: TransactionEvent): Promise<void>;
}
