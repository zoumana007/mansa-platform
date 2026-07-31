import type { TransferCommand } from "./transfer-command.js";
import type { TransferRepository } from "./transfer-repository.js";
import { TransferResult } from "./transfer-result.js";

export class TransferIdentityConflictError extends Error {
  constructor(
    public readonly transferId: string,
    public readonly idempotencyKey: string,
  ) {
    super(
      `transfer identity conflict for transferId=${transferId} and idempotencyKey=${idempotencyKey}`,
    );
    this.name = "TransferIdentityConflictError";
  }
}

export type TransferExecutor = (
  command: TransferCommand,
) => Promise<Readonly<{ transactionId: string }>>;

export type TransferServiceDependencies = Readonly<{
  repository: TransferRepository;
  executeAtomically: TransferExecutor;
  now?: () => Date;
}>;

/**
 * Coordinates idempotent transfer execution.
 *
 * The injected executor owns the atomic ledger mutation. Infrastructure must
 * commit that mutation and `repository.saveCompleted` in the same database
 * transaction. This service guarantees deterministic replay before execution
 * and rejects mismatched transfer identifiers.
 */
export class TransferService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: TransferServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async execute(command: TransferCommand): Promise<TransferResult> {
    const [byTransferId, byIdempotencyKey] = await Promise.all([
      this.dependencies.repository.findByTransferId(command.transferId),
      this.dependencies.repository.findByIdempotencyKey(command.idempotencyKey),
    ]);

    const existing = byTransferId ?? byIdempotencyKey;
    if (existing) {
      if (
        (byTransferId && byIdempotencyKey &&
          byTransferId.transactionId !== byIdempotencyKey.transactionId) ||
        existing.transferId !== command.transferId
      ) {
        throw new TransferIdentityConflictError(
          command.transferId,
          command.idempotencyKey,
        );
      }

      return TransferResult.replayed(
        existing.transferId,
        existing.transactionId,
        existing.completedAt,
      );
    }

    const execution = await this.dependencies.executeAtomically(command);
    const result = TransferResult.completed(
      command.transferId,
      execution.transactionId,
      this.now(),
    );

    await this.dependencies.repository.saveCompleted({ command, result });
    return result;
  }
}
