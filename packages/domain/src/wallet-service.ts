import type { CurrencyCode, Money } from "./money.js";
import type { WalletRepository } from "./wallet-repository.js";
import { Wallet } from "./wallet.js";

export class WalletAlreadyExistsError extends Error {
  constructor(public readonly walletId: string) {
    super(`wallet already exists: ${walletId}`);
    this.name = "WalletAlreadyExistsError";
  }
}

export class WalletNotFoundError extends Error {
  constructor(public readonly walletId: string) {
    super(`wallet not found: ${walletId}`);
    this.name = "WalletNotFoundError";
  }
}

export type WalletServiceDependencies = Readonly<{
  repository: WalletRepository;
  now?: () => Date;
}>;

export class WalletService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: WalletServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async create(input: {
    id: string;
    ownerId: string;
    currency: CurrencyCode;
  }): Promise<Wallet> {
    const existing = await this.dependencies.repository.findById(input.id);
    if (existing) {
      throw new WalletAlreadyExistsError(input.id);
    }

    const wallet = Wallet.create({ ...input, createdAt: this.now() });
    await this.dependencies.repository.save(wallet);
    return wallet;
  }

  async credit(input: { walletId: string; amount: Money }): Promise<Wallet> {
    const wallet = await this.requireWallet(input.walletId);
    wallet.credit(input.amount, this.now());
    await this.dependencies.repository.save(wallet);
    return wallet;
  }

  async debit(input: { walletId: string; amount: Money }): Promise<Wallet> {
    const wallet = await this.requireWallet(input.walletId);
    wallet.debit(input.amount, this.now());
    await this.dependencies.repository.save(wallet);
    return wallet;
  }

  async suspend(walletId: string): Promise<Wallet> {
    const wallet = await this.requireWallet(walletId);
    wallet.suspend(this.now());
    await this.dependencies.repository.save(wallet);
    return wallet;
  }

  async activate(walletId: string): Promise<Wallet> {
    const wallet = await this.requireWallet(walletId);
    wallet.activate(this.now());
    await this.dependencies.repository.save(wallet);
    return wallet;
  }

  async close(walletId: string): Promise<Wallet> {
    const wallet = await this.requireWallet(walletId);
    wallet.close(this.now());
    await this.dependencies.repository.save(wallet);
    return wallet;
  }

  private async requireWallet(walletId: string): Promise<Wallet> {
    const wallet = await this.dependencies.repository.findById(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }
    return wallet;
  }
}
