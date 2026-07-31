import type { TransferCommand } from "./transfer-command.js";
import type { TransferResult } from "./transfer-result.js";

/**
 * Persistence boundary for transfer execution and idempotent replay.
 *
 * Implementations must guarantee uniqueness for both `transferId` and
 * `idempotencyKey`. Recording a completed transfer must be atomic with the
 * underlying ledger mutation at the infrastructure layer.
 */
export interface TransferRepository {
  findByTransferId(transferId: string): Promise<TransferResult | null>;

  findByIdempotencyKey(idempotencyKey: string): Promise<TransferResult | null>;

  saveCompleted(input: Readonly<{
    command: TransferCommand;
    result: TransferResult;
  }>): Promise<void>;
}
