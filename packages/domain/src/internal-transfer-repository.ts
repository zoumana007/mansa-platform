import type { InternalTransfer } from "./internal-transfer.js";

export interface InternalTransferRepository {
  findById(id: string): Promise<InternalTransfer | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<InternalTransfer | null>;
  save(transfer: InternalTransfer): Promise<void>;
}
