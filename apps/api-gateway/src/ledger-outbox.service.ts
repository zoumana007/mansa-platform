import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service';

export interface OutboxClaimOptions {
  limit?: number;
  maxAttempts?: number;
  leaseMs?: number;
  now?: Date;
}

export interface OutboxDeadLetterOptions {
  limit?: number;
  maxAttempts?: number;
}

export interface ClaimedOutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  transactionId: string | null;
  attempts: number;
  availableAt: Date;
  createdAt: Date;
}

export interface DeadLetterOutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  transactionId: string | null;
  attempts: number;
  availableAt: Date;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_LIMIT = 50;
const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_LEASE_MS = 30_000;
const MAX_LIMIT = 200;
const MAX_ERROR_LENGTH = 2_000;

const normalizePositiveInteger = (value: number, fallback: number, maximum?: number): number => {
  if (!Number.isInteger(value) || value <= 0) {
    return fallback;
  }
  return maximum === undefined ? value : Math.min(value, maximum);
};

const truncateError = (error: unknown): string => {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return text.slice(0, MAX_ERROR_LENGTH);
};

@Injectable()
export class LedgerOutboxService {
  public constructor(private readonly prisma: PrismaService) {}

  public async claimBatch(options: OutboxClaimOptions = {}): Promise<ClaimedOutboxEvent[]> {
    const now = options.now ?? new Date();
    const limit = normalizePositiveInteger(options.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT, MAX_LIMIT);
    const maxAttempts = normalizePositiveInteger(
      options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
    );
    const leaseMs = normalizePositiveInteger(options.leaseMs ?? DEFAULT_LEASE_MS, DEFAULT_LEASE_MS);
    const leaseUntil = new Date(now.getTime() + leaseMs);

    const candidates = await this.prisma.outboxEvent.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        availableAt: { lte: now },
        attempts: { lt: maxAttempts },
      },
      orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        aggregateType: true,
        aggregateId: true,
        eventType: true,
        payload: true,
        transactionId: true,
        status: true,
        attempts: true,
        availableAt: true,
        createdAt: true,
      },
    });

    const claimed: ClaimedOutboxEvent[] = [];
    for (const candidate of candidates) {
      const result = await this.prisma.outboxEvent.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status,
          attempts: candidate.attempts,
          availableAt: { lte: now },
        },
        data: {
          attempts: { increment: 1 },
          availableAt: leaseUntil,
        },
      });

      if (result.count !== 1) {
        continue;
      }

      claimed.push({
        id: candidate.id,
        aggregateType: candidate.aggregateType,
        aggregateId: candidate.aggregateId,
        eventType: candidate.eventType,
        payload: candidate.payload,
        transactionId: candidate.transactionId,
        attempts: candidate.attempts + 1,
        availableAt: leaseUntil,
        createdAt: candidate.createdAt,
      });
    }

    return claimed;
  }

  public async listDeadLetters(
    options: OutboxDeadLetterOptions = {},
  ): Promise<DeadLetterOutboxEvent[]> {
    const limit = normalizePositiveInteger(options.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT, MAX_LIMIT);
    const maxAttempts = normalizePositiveInteger(
      options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
    );

    return this.prisma.outboxEvent.findMany({
      where: {
        status: 'FAILED',
        attempts: { gte: maxAttempts },
      },
      orderBy: [{ updatedAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        aggregateType: true,
        aggregateId: true,
        eventType: true,
        transactionId: true,
        attempts: true,
        availableAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public async requeueDeadLetter(
    eventId: string,
    options: { maxAttempts?: number; now?: Date } = {},
  ): Promise<boolean> {
    const maxAttempts = normalizePositiveInteger(
      options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
    );
    const now = options.now ?? new Date();
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        id: eventId,
        status: 'FAILED',
        attempts: { gte: maxAttempts },
      },
      data: {
        status: 'PENDING',
        attempts: 0,
        availableAt: now,
        publishedAt: null,
        lastError: null,
      },
    });

    return result.count === 1;
  }

  public async markPublished(eventId: string, publishedAt = new Date()): Promise<boolean> {
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        id: eventId,
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt,
        availableAt: publishedAt,
        lastError: null,
      },
    });

    return result.count === 1;
  }

  public async markFailed(
    eventId: string,
    error: unknown,
    retryDelayMs: number,
    now = new Date(),
  ): Promise<boolean> {
    const delay = Math.max(0, Number.isFinite(retryDelayMs) ? Math.floor(retryDelayMs) : 0);
    const retryAt = new Date(now.getTime() + delay);
    const result = await this.prisma.outboxEvent.updateMany({
      where: {
        id: eventId,
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        status: 'FAILED',
        availableAt: retryAt,
        lastError: truncateError(error),
      },
    });

    return result.count === 1;
  }
}
