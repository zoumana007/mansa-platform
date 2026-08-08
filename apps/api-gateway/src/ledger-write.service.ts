import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import type { NormalizedLedgerReversalRequest } from './ledger-reversal.validation';
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

const oppositeDirection = (direction: LedgerDirection): LedgerDirection =>
  direction === 'DEBIT' ? 'CREDIT' : 'DEBIT';

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

const reversalFingerprint = (
  originalTransactionId: string,
  request: NormalizedLedgerReversalRequest,
): string =>
  createHash('sha256')
    .update(
      JSON.stringify({
        originalTransactionId,
        reasonCode: request.reasonCode,
        reason: request.reason,
        idempotencyKey: request.idempotencyKey,
        correlationId: request.correlationId,
      }),
      'utf8',
    )
    .digest('hex');

const reversalReference = (originalReference: string, idempotencyKey: string): string => {
  const suffix = createHash('sha256').update(idempotencyKey, 'utf8').digest('hex').slice(0, 12);
  return `REV-${originalReference}-${suffix}`;
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

  public async reverse(
    originalTransactionId: string,
    request: NormalizedLedgerReversalRequest,
  ): Promise<LedgerWriteResult> {
    const fingerprint = reversalFingerprint(originalTransactionId, request);

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

      const original = await tx.ledgerTransaction.findUnique({
        where: { id: originalTransactionId },
        select: {
          id: true,
          reference: true,
          transactionType: true,
          status: true,
          countryCode: true,
          reversedBy: { select: { id: true } },
          entries: {
            orderBy: { sequence: 'asc' },
            select: {
              accountId: true,
              direction: true,
              amountMinor: true,
              currency: true,
              description: true,
              account: { select: { type: true } },
            },
          },
        },
      });

      if (original === null) {
        throw new UnprocessableEntityException('The ledger transaction to reverse does not exist.');
      }
      if (original.status !== 'POSTED') {
        throw new ConflictException('Only a POSTED ledger transaction can be reversed.');
      }
      if (original.reversedBy !== null) {
        throw new ConflictException('The ledger transaction has already been reversed.');
      }
      if (original.entries.length < 2) {
        throw new UnprocessableEntityException('The ledger transaction has insufficient entries to reverse.');
      }

      const postedAt = new Date();
      const transaction = await tx.ledgerTransaction.create({
        data: {
          reference: reversalReference(original.reference, request.idempotencyKey),
          transactionType: `${original.transactionType}_REVERSAL`,
          idempotencyKey: request.idempotencyKey,
          requestFingerprint: fingerprint,
          correlationId: request.correlationId,
          countryCode: original.countryCode,
          status: 'POSTED',
          description: `Reversal of ${original.reference}: ${request.reason}`,
          occurredAt: postedAt,
          postedAt,
          reversalOfTransactionId: original.id,
          metadata: {
            reasonCode: request.reasonCode,
            reason: request.reason,
            originalReference: original.reference,
          },
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

      for (const [index, entry] of original.entries.entries()) {
        const direction = oppositeDirection(entry.direction as LedgerDirection);
        const createdEntry = await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: entry.accountId,
            sequence: index + 1,
            direction,
            amountMinor: entry.amountMinor,
            currency: entry.currency,
            description: entry.description ?? `Reversal of ${original.reference}`,
            postedAt,
          },
          select: { id: true },
        });

        const delta = balanceDelta(
          entry.account.type as LedgerAccountType,
          direction,
          entry.amountMinor,
        );
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

      await tx.ledgerTransaction.update({
        where: { id: original.id },
        data: { status: 'REVERSED', reversedAt: postedAt },
      });

      await tx.outboxEvent.create({
        data: {
          aggregateType: 'LEDGER_TRANSACTION',
          aggregateId: transaction.id,
          eventType: 'ledger.transaction.reversed.v1',
          transactionId: transaction.id,
          payload: {
            transactionId: transaction.id,
            reversalOfTransactionId: original.id,
            originalReference: original.reference,
            reasonCode: request.reasonCode,
            reason: request.reason,
            correlationId: request.correlationId,
            countryCode: original.countryCode,
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
