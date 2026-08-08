import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import type { NormalizedLedgerWriteRequest } from './ledger-write.validation';
import { PrismaService } from './prisma.service';

type LedgerAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
type LedgerDirection = 'DEBIT' | 'CREDIT';

export interface LedgerWriteResult {
  readonly id: string;
  readonly reference: string;
  readonly transactionType: string;
  readonly status: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly countryCode: string;
  readonly occurredAt: string;
  readonly postedAt: string | null;
  readonly replayed: boolean;
}

const naturalDirection = (type: LedgerAccountType): LedgerDirection =>
  type === 'ASSET' || type === 'EXPENSE' ? 'DEBIT' : 'CREDIT';

const balanceDelta = (
  type: LedgerAccountType,
  direction: LedgerDirection,
  amountMinor: bigint,
): bigint => (direction === naturalDirection(type) ? amountMinor : -amountMinor);

const stableMetadata = (
  metadata: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> | undefined => {
  if (metadata === undefined) return undefined;
  return Object.fromEntries(Object.entries(metadata).sort(([left], [right]) => left.localeCompare(right)));
};

const requestFingerprint = (request: NormalizedLedgerWriteRequest): string => {
  const canonical = JSON.stringify({
    reference: request.reference,
    transactionType: request.transactionType,
    entries: request.entries.map((entry) => ({
      accountId: entry.accountId,
      direction: entry.direction,
      amountMinor: entry.amountMinor.toString(),
      currency: entry.currency,
      ...(entry.description === undefined ? {} : { description: entry.description }),
    })),
    idempotencyKey: request.idempotencyKey,
    correlationId: request.correlationId,
    countryCode: request.countryCode,
    occurredAt: request.occurredAt.toISOString(),
    ...(request.metadata === undefined ? {} : { metadata: stableMetadata(request.metadata) }),
  });

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
};

@Injectable()
export class LedgerWriteService {
  public constructor(private readonly prisma: PrismaService) {}

  public async post(request: NormalizedLedgerWriteRequest): Promise<LedgerWriteResult> {
    const fingerprint = requestFingerprint(request);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ledgerTransaction.findUnique({
        where: { idempotencyKey: request.idempotencyKey },
        select: {
          id: true,
          reference: true,
          transactionType: true,
          status: true,
          idempotencyKey: true,
          correlationId: true,
          countryCode: true,
          occurredAt: true,
          postedAt: true,
          requestFingerprint: true,
        },
      });

      if (existing !== null) {
        if (existing.requestFingerprint !== fingerprint) {
          throw new ConflictException(
            'The idempotency key is already associated with a different ledger request.',
          );
        }

        return {
          id: existing.id,
          reference: existing.reference,
          transactionType: existing.transactionType,
          status: existing.status,
          idempotencyKey: existing.idempotencyKey,
          correlationId: existing.correlationId,
          countryCode: existing.countryCode,
          occurredAt: existing.occurredAt.toISOString(),
          postedAt: existing.postedAt?.toISOString() ?? null,
          replayed: true,
        };
      }

      const uniqueAccountIds = [...new Set(request.entries.map((entry) => entry.accountId))];
      const accounts = await tx.ledgerAccount.findMany({
        where: { id: { in: uniqueAccountIds } },
        select: {
          id: true,
          type: true,
          currency: true,
          countryCode: true,
        },
      });

      if (accounts.length !== uniqueAccountIds.length) {
        throw new UnprocessableEntityException('One or more ledger accounts do not exist.');
      }

      const accountsById = new Map(accounts.map((account) => [account.id, account]));
      for (const entry of request.entries) {
        const account = accountsById.get(entry.accountId);
        if (account === undefined) {
          throw new UnprocessableEntityException('Ledger account lookup failed.');
        }
        if (account.currency !== entry.currency) {
          throw new UnprocessableEntityException(
            `Ledger account ${entry.accountId} does not accept currency ${entry.currency}.`,
          );
        }
        if (account.countryCode !== request.countryCode) {
          throw new UnprocessableEntityException(
            `Ledger account ${entry.accountId} does not belong to country ${request.countryCode}.`,
          );
        }
      }

      const postedAt = new Date();
      const transaction = await tx.ledgerTransaction.create({
        data: {
          reference: request.reference,
          transactionType: request.transactionType,
          idempotencyKey: request.idempotencyKey,
          requestFingerprint: fingerprint,
          correlationId: request.correlationId,
          countryCode: request.countryCode,
          status: 'POSTED',
          occurredAt: request.occurredAt,
          postedAt,
          ...(request.metadata === undefined ? {} : { metadata: request.metadata }),
        },
        select: {
          id: true,
          reference: true,
          transactionType: true,
          status: true,
          idempotencyKey: true,
          correlationId: true,
          countryCode: true,
          occurredAt: true,
          postedAt: true,
        },
      });

      for (const [index, entry] of request.entries.entries()) {
        const account = accountsById.get(entry.accountId);
        if (account === undefined) {
          throw new UnprocessableEntityException('Ledger account lookup failed.');
        }

        const createdEntry = await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: entry.accountId,
            sequence: index + 1,
            direction: entry.direction,
            amountMinor: entry.amountMinor,
            currency: entry.currency,
            ...(entry.description === undefined ? {} : { description: entry.description }),
            postedAt,
          },
          select: { id: true },
        });

        const delta = balanceDelta(account.type as LedgerAccountType, entry.direction, entry.amountMinor);
        await tx.ledgerBalanceProjection.upsert({
          where: { accountId: entry.accountId },
          create: {
            accountId: entry.accountId,
            availableMinor: delta,
            pendingMinor: 0n,
            currency: entry.currency,
            lastEntryPostedAt: postedAt,
            lastEntryId: createdEntry.id,
            projectionSequence: 1n,
          },
          update: {
            availableMinor: { increment: delta },
            lastEntryPostedAt: postedAt,
            lastEntryId: createdEntry.id,
            projectionSequence: { increment: 1n },
          },
        });
      }

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'LEDGER_TRANSACTION',
          aggregateId: transaction.id,
          eventType: 'ledger.transaction.posted.v1',
          transactionId: transaction.id,
          payload: {
            transactionId: transaction.id,
            reference: transaction.reference,
            transactionType: transaction.transactionType,
            correlationId: transaction.correlationId,
            countryCode: transaction.countryCode,
            occurredAt: transaction.occurredAt.toISOString(),
            postedAt: postedAt.toISOString(),
          },
        },
      });

      return {
        id: transaction.id,
        reference: transaction.reference,
        transactionType: transaction.transactionType,
        status: transaction.status,
        idempotencyKey: transaction.idempotencyKey,
        correlationId: transaction.correlationId,
        countryCode: transaction.countryCode,
        occurredAt: transaction.occurredAt.toISOString(),
        postedAt: transaction.postedAt?.toISOString() ?? null,
        replayed: false,
      };
    });
  }
}
