import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service';

export interface LedgerAccountView {
  readonly id: string;
  readonly code: string;
  readonly ownerType: string;
  readonly ownerId: string | null;
  readonly name: string;
  readonly type: string;
  readonly currency: string;
  readonly countryCode: string;
  readonly isSystemAccount: boolean;
}

export interface LedgerBalanceView {
  readonly accountId: string;
  readonly availableMinor: string;
  readonly pendingMinor: string;
  readonly currency: string;
  readonly asOf: string;
  readonly projectionSequence: string;
}

export interface LedgerEntryView {
  readonly id: string;
  readonly transactionId: string;
  readonly accountId: string;
  readonly sequence: number;
  readonly direction: string;
  readonly amountMinor: string;
  readonly currency: string;
  readonly description?: string;
  readonly postedAt: string;
}

export interface LedgerTransactionView {
  readonly id: string;
  readonly reference: string;
  readonly transactionType: string;
  readonly status: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly countryCode: string;
  readonly description?: string;
  readonly occurredAt: string;
  readonly postedAt: string | null;
  readonly reversedAt: string | null;
  readonly reversalOfTransactionId: string | null;
  readonly reversedByTransactionId: string | null;
  readonly entries: readonly LedgerEntryView[];
}

export interface LedgerEntryPage {
  readonly items: readonly LedgerEntryView[];
  readonly nextCursor: string | null;
}

interface DecodedCursor {
  readonly postedAt: Date;
  readonly entryId: string;
}

const encodeCursor = (postedAt: Date, entryId: string): string =>
  Buffer.from(JSON.stringify({ postedAt: postedAt.toISOString(), entryId }), 'utf8').toString(
    'base64url',
  );

const decodeCursor = (cursor: string): DecodedCursor => {
  try {
    const raw = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      postedAt?: unknown;
      entryId?: unknown;
    };
    if (typeof raw.postedAt !== 'string' || typeof raw.entryId !== 'string') {
      throw new Error('invalid cursor payload');
    }
    const postedAt = new Date(raw.postedAt);
    if (Number.isNaN(postedAt.getTime()) || raw.entryId.length === 0) {
      throw new Error('invalid cursor values');
    }
    return { postedAt, entryId: raw.entryId };
  } catch {
    throw new Error('INVALID_LEDGER_CURSOR');
  }
};

const mapEntry = (entry: {
  readonly id: string;
  readonly transactionId: string;
  readonly accountId: string;
  readonly sequence: number;
  readonly direction: string;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly description: string | null;
  readonly postedAt: Date;
}): LedgerEntryView => ({
  id: entry.id,
  transactionId: entry.transactionId,
  accountId: entry.accountId,
  sequence: entry.sequence,
  direction: entry.direction,
  amountMinor: entry.amountMinor.toString(),
  currency: entry.currency,
  ...(entry.description === null ? {} : { description: entry.description }),
  postedAt: entry.postedAt.toISOString(),
});

@Injectable()
export class LedgerReadService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getTransaction(transactionId: string): Promise<LedgerTransactionView | null> {
    const transaction = await this.prisma.ledgerTransaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        reference: true,
        transactionType: true,
        status: true,
        idempotencyKey: true,
        correlationId: true,
        countryCode: true,
        description: true,
        occurredAt: true,
        postedAt: true,
        reversedAt: true,
        reversalOfTransactionId: true,
        reversedBy: { select: { id: true } },
        entries: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            transactionId: true,
            accountId: true,
            sequence: true,
            direction: true,
            amountMinor: true,
            currency: true,
            description: true,
            postedAt: true,
          },
        },
      },
    });

    if (transaction === null) {
      return null;
    }

    return {
      id: transaction.id,
      reference: transaction.reference,
      transactionType: transaction.transactionType,
      status: transaction.status,
      idempotencyKey: transaction.idempotencyKey,
      correlationId: transaction.correlationId,
      countryCode: transaction.countryCode,
      ...(transaction.description === null ? {} : { description: transaction.description }),
      occurredAt: transaction.occurredAt.toISOString(),
      postedAt: transaction.postedAt?.toISOString() ?? null,
      reversedAt: transaction.reversedAt?.toISOString() ?? null,
      reversalOfTransactionId: transaction.reversalOfTransactionId,
      reversedByTransactionId: transaction.reversedBy?.id ?? null,
      entries: transaction.entries.map(mapEntry),
    };
  }

  public async getAccount(accountId: string): Promise<LedgerAccountView | null> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        code: true,
        ownerType: true,
        ownerId: true,
        name: true,
        type: true,
        currency: true,
        countryCode: true,
        isSystemAccount: true,
      },
    });

    return account;
  }

  public async getBalance(accountId: string): Promise<LedgerBalanceView | null> {
    const balance = await this.prisma.ledgerBalanceProjection.findUnique({
      where: { accountId },
      select: {
        accountId: true,
        availableMinor: true,
        pendingMinor: true,
        currency: true,
        updatedAt: true,
        projectionSequence: true,
      },
    });

    if (balance === null) {
      return null;
    }

    return {
      accountId: balance.accountId,
      availableMinor: balance.availableMinor.toString(),
      pendingMinor: balance.pendingMinor.toString(),
      currency: balance.currency,
      asOf: balance.updatedAt.toISOString(),
      projectionSequence: balance.projectionSequence.toString(),
    };
  }

  public async listEntries(input: {
    readonly accountId: string;
    readonly from?: Date;
    readonly to?: Date;
    readonly cursor?: string;
    readonly limit: number;
  }): Promise<LedgerEntryPage> {
    const after = input.cursor === undefined ? undefined : decodeCursor(input.cursor);
    const take = input.limit + 1;

    const items = await this.prisma.ledgerEntry.findMany({
      where: {
        accountId: input.accountId,
        ...(input.from === undefined && input.to === undefined
          ? {}
          : {
              postedAt: {
                ...(input.from === undefined ? {} : { gte: input.from }),
                ...(input.to === undefined ? {} : { lte: input.to }),
              },
            }),
        ...(after === undefined
          ? {}
          : {
              OR: [
                { postedAt: { gt: after.postedAt } },
                { postedAt: after.postedAt, id: { gt: after.entryId } },
              ],
            }),
      },
      orderBy: [{ postedAt: 'asc' }, { id: 'asc' }],
      take,
      select: {
        id: true,
        transactionId: true,
        accountId: true,
        sequence: true,
        direction: true,
        amountMinor: true,
        currency: true,
        description: true,
        postedAt: true,
      },
    });

    const hasMore = items.length > input.limit;
    const visible = hasMore ? items.slice(0, input.limit) : items;
    const last = visible.at(-1);

    return {
      items: visible.map(mapEntry),
      nextCursor:
        hasMore && last !== undefined ? encodeCursor(last.postedAt, last.id) : null,
    };
  }
}
