import type { TransferCommand } from "./transfer-command.js";
import type { TransferExecutor } from "./transfer-service.js";
import type { WalletRepository } from "./wallet-repository.js";

export class TransferWalletNotFoundError extends Error {
  constructor(public readonly walletId: string) {
    super(`wallet not found: ${walletId}`);
    this.name = "TransferWalletNotFoundError";
  }
}

export class TransferCurrencyMismatchError extends Error {
  constructor(
    public readonly sourceCurrency: string,
    public readonly destinationCurrency: string,
    public readonly amountCurrency: string,
  ) {
    super("transfer currencies must match");
    this.name = "TransferCurrencyMismatchError";
  }
}

export type WalletTransferExecutorDependencies = Readonly<{
  wallets: WalletRepository;
  nextTransactionId: () => string;
  now?: () => Date;
}>;

/**
 * Builds the domain part of an atomic wallet-to-wallet transfer.
 *
 * A production adapter must invoke this executor inside a database transaction
 * with wallet row locks and commit the transfer result and outbox events in the
 * same unit of work. The repository used here is therefore a transaction-scoped
 * port, not a global non-transactional adapter.
 */
export function createWalletTransferExecutor(
  dependencies: WalletTransferExecutorDependencies,
): TransferExecutor {
  const now = dependencies.now ?? (() => new Date());

  return async (command: TransferCommand) => {
    const transactionId = dependencies.nextTransactionId().trim();
    if (transactionId.length === 0) {
      throw new Error("transaction id must not be empty");
    }

    const [source, destination] = await Promise.all([
      dependencies.wallets.findById(command.sourceWalletId),
      dependencies.wallets.findById(command.destinationWalletId),
    ]);

    if (!source) {
      throw new TransferWalletNotFoundError(command.sourceWalletId);
    }
    if (!destination) {
      throw new TransferWalletNotFoundError(command.destinationWalletId);
    }

    if (
      source.currency !== destination.currency ||
      source.currency !== command.amount.currency
    ) {
      throw new TransferCurrencyMismatchError(
        source.currency,
        destination.currency,
        command.amount.currency,
      );
    }

    const occurredAt = now();
    source.debit(command.amount, occurredAt);
    destination.credit(command.amount, occurredAt);

    await dependencies.wallets.save(source);
    await dependencies.wallets.save(destination);

    return { transactionId };
  };
}
