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
  readonly sequence: number;
  readonly direction: string;
  readonly amountMinor: string;
  readonly currency: string;
  readonly description?: string;
  readonly postedAt: string;
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

@Injectable()
export class LedgerReadService {
  public constructor(private readonly prisma: PrismaService) {}

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
      items: visible.map((entry) => ({
        id: entry.id,
        transactionId: entry.transactionId,
        sequence: entry.sequence,
        direction: entry.direction,
        amountMinor: entry.amountMinor.toString(),
        currency: entry.currency,
        ...(entry.description === null ? {} : { description: entry.description }),
        postedAt: entry.postedAt.toISOString(),
      })),
      nextCursor:
        hasMore && last !== undefined ? encodeCursor(last.postedAt, last.id) : null,
    };
  }
}
