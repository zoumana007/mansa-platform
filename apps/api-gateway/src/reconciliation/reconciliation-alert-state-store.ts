import { Injectable } from '@nestjs/common';

import type { ReconciliationSloStatus } from './reconciliation-slo-policy';

export const RECONCILIATION_ALERT_STATE_STORE = Symbol('RECONCILIATION_ALERT_STATE_STORE');

export interface ReconciliationAlertState {
  readonly status: ReconciliationSloStatus | null;
  readonly lastNotificationAtMs: number | null;
}

export interface ReconciliationAlertStateStore {
  transact<T>(
    key: string,
    operation: (state: ReconciliationAlertState) => {
      readonly state: ReconciliationAlertState;
      readonly result: T;
    },
  ): Promise<T>;
  reset(key: string): Promise<void>;
}

const EMPTY_STATE: ReconciliationAlertState = Object.freeze({
  status: null,
  lastNotificationAtMs: null,
});

/**
 * Default bounded implementation for local development and single-process tests.
 *
 * The contract is intentionally async and atomic so production can replace this
 * store with Redis, PostgreSQL advisory/row locking or another shared backend
 * without changing the alerting decision policy.
 */
@Injectable()
export class InMemoryReconciliationAlertStateStore implements ReconciliationAlertStateStore {
  private readonly states = new Map<string, ReconciliationAlertState>();
  private readonly queues = new Map<string, Promise<void>>();

  public async transact<T>(
    key: string,
    operation: (state: ReconciliationAlertState) => {
      readonly state: ReconciliationAlertState;
      readonly result: T;
    },
  ): Promise<T> {
    const normalizedKey = this.normalizeKey(key);
    const previous = this.queues.get(normalizedKey) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.queues.set(normalizedKey, previous.then(() => current));

    await previous;
    try {
      const state = this.states.get(normalizedKey) ?? EMPTY_STATE;
      const next = operation(state);
      this.states.set(normalizedKey, Object.freeze({ ...next.state }));
      return next.result;
    } finally {
      release();
      if (this.queues.get(normalizedKey) === current) this.queues.delete(normalizedKey);
    }
  }

  public async reset(key: string): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    await this.transact(normalizedKey, () => ({ state: EMPTY_STATE, result: undefined }));
  }

  private normalizeKey(key: string): string {
    const normalized = key.trim();
    if (!normalized) throw new Error('alert state key is required');
    return normalized;
  }
}
