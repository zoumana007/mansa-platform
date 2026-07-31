import type { Money } from "./money.js";
import {
  InternalTransfer,
  type InternalTransferStatus,
} from "./internal-transfer.js";
import type { InternalTransferRepository } from "./internal-transfer-repository.js";

export class InternalTransferNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`internal transfer not found: ${id}`);
    this.name = "InternalTransferNotFoundError";
  }
}

export type InternalTransferServiceDependencies = Readonly<{
  repository: InternalTransferRepository;
  createId: () => string;
  now?: () => Date;
}>;

export class InternalTransferService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: InternalTransferServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async get(id: string): Promise<InternalTransfer> {
    const transfer = await this.dependencies.repository.findById(id);

    if (!transfer) {
      throw new InternalTransferNotFoundError(id);
    }

    return transfer;
  }

  async create(input: {
    idempotencyKey: string;
    sourceWalletId: string;
    destinationWalletId: string;
    amount: Money;
    description?: string;
    clientReference?: string;
  }): Promise<InternalTransfer> {
    const existing = await this.dependencies.repository.findByIdempotencyKey(
      input.idempotencyKey,
    );

    if (existing) {
      return existing;
    }

    const transfer = InternalTransfer.create({
      ...input,
      id: this.dependencies.createId(),
      now: this.now(),
    });

    await this.dependencies.repository.save(transfer);
    return transfer;
  }

  async transition(input: {
    id: string;
    to: InternalTransferStatus;
    failureCode?: string;
  }): Promise<InternalTransfer> {
    const transfer = await this.get(input.id);
    transfer.transition({
      to: input.to,
      failureCode: input.failureCode,
      now: this.now(),
    });
    await this.dependencies.repository.save(transfer);
    return transfer;
  }
}
