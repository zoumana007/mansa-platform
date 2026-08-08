import { Injectable } from '@nestjs/common';

import {
  ClaimedOutboxEvent,
  LedgerOutboxService,
  OutboxClaimOptions,
} from './ledger-outbox.service';

export interface LedgerOutboxPublisher {
  publish(event: ClaimedOutboxEvent): Promise<void>;
}

export interface LedgerOutboxDispatchOptions extends OutboxClaimOptions {
  baseRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  jitterRatio?: number;
  random?: () => number;
}

export interface LedgerOutboxDispatchResult {
  claimed: number;
  published: number;
  failed: number;
}

const DEFAULT_BASE_RETRY_DELAY_MS = 1_000;
const DEFAULT_MAX_RETRY_DELAY_MS = 60_000;
const DEFAULT_JITTER_RATIO = 0.2;

const normalizeDelay = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
};

const normalizeJitterRatio = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_JITTER_RATIO;
  }
  return Math.min(1, Math.max(0, value));
};

@Injectable()
export class LedgerOutboxDispatcherService {
  public constructor(private readonly outbox: LedgerOutboxService) {}

  public async dispatchBatch(
    publisher: LedgerOutboxPublisher,
    options: LedgerOutboxDispatchOptions = {},
  ): Promise<LedgerOutboxDispatchResult> {
    const claimed = await this.outbox.claimBatch(options);
    let published = 0;
    let failed = 0;

    for (const event of claimed) {
      try {
        await publisher.publish(event);
        const marked = await this.outbox.markPublished(event.id);
        if (marked) {
          published += 1;
        }
      } catch (error) {
        const retryDelayMs = this.computeRetryDelayMs(event.attempts, options);
        await this.outbox.markFailed(event.id, error, retryDelayMs);
        failed += 1;
      }
    }

    return {
      claimed: claimed.length,
      published,
      failed,
    };
  }

  public computeRetryDelayMs(
    attempts: number,
    options: LedgerOutboxDispatchOptions = {},
  ): number {
    const baseDelayMs = normalizeDelay(options.baseRetryDelayMs, DEFAULT_BASE_RETRY_DELAY_MS);
    const maxDelayMs = Math.max(
      baseDelayMs,
      normalizeDelay(options.maxRetryDelayMs, DEFAULT_MAX_RETRY_DELAY_MS),
    );
    const exponent = Math.max(0, Math.floor(attempts) - 1);
    const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** exponent);
    const jitterRatio = normalizeJitterRatio(options.jitterRatio);
    const random = options.random ?? Math.random;
    const centeredRandom = Math.min(1, Math.max(0, random())) * 2 - 1;
    const jitter = exponentialDelay * jitterRatio * centeredRandom;

    return Math.max(0, Math.min(maxDelayMs, Math.round(exponentialDelay + jitter)));
  }
}
