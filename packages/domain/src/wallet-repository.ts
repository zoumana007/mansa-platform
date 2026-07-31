import { CurrencyCode } from "./money.js";
import { Wallet, WalletStatus } from "./wallet.js";

export interface WalletSearchCriteria {
  ownerId?: string;
  currency?: CurrencyCode;
  status?: WalletStatus;
}

/**
 * Persistence port for wallet aggregates.
 *
 * Production implementations must preserve optimistic concurrency and must
 * never expose mutable persistence records shared between requests.
 */
export interface WalletRepository {
  findById(id: string): Promise<Wallet | null>;
  findByOwnerId(ownerId: string): Promise<readonly Wallet[]>;
  search(criteria: WalletSearchCriteria): Promise<readonly Wallet[]>;
  save(wallet: Wallet): Promise<void>;
}

/**
 * Minimal in-memory adapter intended for isolated tests and local development.
 * It deliberately keeps aggregate references and therefore must not be shared
 * between requests or used as a production persistence mechanism.
 */
export class InMemoryWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, Wallet>();

  async findById(id: string): Promise<Wallet | null> {
    return this.wallets.get(id) ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<readonly Wallet[]> {
    return [...this.wallets.values()].filter(
      (wallet) => wallet.ownerId === ownerId,
    );
  }

  async search(criteria: WalletSearchCriteria): Promise<readonly Wallet[]> {
    return [...this.wallets.values()].filter((wallet) => {
      if (criteria.ownerId && wallet.ownerId !== criteria.ownerId) {
        return false;
      }
      if (criteria.currency && wallet.currency !== criteria.currency) {
        return false;
      }
      if (criteria.status && wallet.status !== criteria.status) {
        return false;
      }
      return true;
    });
  }

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.id, wallet);
  }
}
