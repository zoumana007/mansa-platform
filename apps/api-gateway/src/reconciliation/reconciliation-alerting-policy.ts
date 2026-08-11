import { Inject, Injectable, Optional } from '@nestjs/common';

import {
  RECONCILIATION_ALERT_STATE_STORE,
  type ReconciliationAlertState,
  type ReconciliationAlertStateStore,
} from './reconciliation-alert-state-store';
import type {
  ReconciliationSloEvaluation,
  ReconciliationSloStatus,
} from './reconciliation-slo-policy';

export type ReconciliationAlertEvent = 'WARNING' | 'CRITICAL' | 'RECOVERED' | 'REMINDER';

export type ReconciliationAlertDecisionReason =
  | 'STATE_CHANGE'
  | 'COOLDOWN_ELAPSED'
  | 'COOLDOWN_ACTIVE'
  | 'NO_DATA'
  | 'HEALTHY_STEADY';

export interface ReconciliationAlertingOptions {
  readonly cooldownMs: number;
}

export interface ReconciliationAlertDecision {
  readonly shouldNotify: boolean;
  readonly event: ReconciliationAlertEvent | null;
  readonly reason: ReconciliationAlertDecisionReason;
  readonly previousStatus: ReconciliationSloStatus | null;
  readonly currentStatus: ReconciliationSloStatus;
  readonly evaluatedAt: string;
  readonly nextEligibleReminderAt: string | null;
}

export const DEFAULT_RECONCILIATION_ALERTING_OPTIONS: ReconciliationAlertingOptions = Object.freeze({
  cooldownMs: 15 * 60 * 1000,
});

export const DEFAULT_RECONCILIATION_ALERT_STATE_KEY = 'reconciliation:alerting:global';

const unhealthy = (status: ReconciliationSloStatus): status is 'WARNING' | 'CRITICAL' =>
  status === 'WARNING' || status === 'CRITICAL';

const iso = (timestampMs: number): string => new Date(timestampMs).toISOString();

@Injectable()
export class ReconciliationAlertingPolicy {
  private state: ReconciliationAlertState = {
    status: null,
    lastNotificationAtMs: null,
  };

  public constructor(
    @Optional()
    @Inject(RECONCILIATION_ALERT_STATE_STORE)
    private readonly sharedStateStore?: ReconciliationAlertStateStore,
  ) {}

  public evaluate(
    evaluation: ReconciliationSloEvaluation,
    evaluatedAtMs: number = Date.now(),
    options: ReconciliationAlertingOptions = DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
  ): ReconciliationAlertDecision {
    const transition = this.transition(this.state, evaluation, evaluatedAtMs, options);
    this.state = transition.state;
    return transition.decision;
  }

  public async evaluateShared(
    evaluation: ReconciliationSloEvaluation,
    evaluatedAtMs: number = Date.now(),
    options: ReconciliationAlertingOptions = DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
    stateKey: string = DEFAULT_RECONCILIATION_ALERT_STATE_KEY,
  ): Promise<ReconciliationAlertDecision> {
    if (!this.sharedStateStore) return this.evaluate(evaluation, evaluatedAtMs, options);
    return this.sharedStateStore.transact(stateKey, (state) => {
      const transition = this.transition(state, evaluation, evaluatedAtMs, options);
      return { state: transition.state, result: transition.decision };
    });
  }

  public reset(): void {
    this.state = { status: null, lastNotificationAtMs: null };
  }

  public async resetShared(stateKey: string = DEFAULT_RECONCILIATION_ALERT_STATE_KEY): Promise<void> {
    if (!this.sharedStateStore) {
      this.reset();
      return;
    }
    await this.sharedStateStore.reset(stateKey);
  }

  private transition(
    state: ReconciliationAlertState,
    evaluation: ReconciliationSloEvaluation,
    evaluatedAtMs: number,
    options: ReconciliationAlertingOptions,
  ): { readonly state: ReconciliationAlertState; readonly decision: ReconciliationAlertDecision } {
    this.validateTimestamp(evaluatedAtMs);
    this.validateOptions(options);

    const previousStatus = state.status;
    const currentStatus = evaluation.status;
    let nextState: ReconciliationAlertState = state;
    let shouldNotify = false;
    let event: ReconciliationAlertEvent | null = null;
    let reason: ReconciliationAlertDecisionReason;

    if (currentStatus === 'NO_DATA') {
      nextState = { ...state, status: currentStatus };
      reason = 'NO_DATA';
    } else if (currentStatus === 'HEALTHY') {
      nextState = { ...state, status: currentStatus };
      if (previousStatus !== null && unhealthy(previousStatus)) {
        nextState = { status: currentStatus, lastNotificationAtMs: evaluatedAtMs };
        shouldNotify = true;
        event = 'RECOVERED';
        reason = 'STATE_CHANGE';
      } else {
        reason = 'HEALTHY_STEADY';
      }
    } else if (previousStatus !== currentStatus) {
      nextState = { status: currentStatus, lastNotificationAtMs: evaluatedAtMs };
      shouldNotify = true;
      event = currentStatus;
      reason = 'STATE_CHANGE';
    } else if (
      state.lastNotificationAtMs === null ||
      evaluatedAtMs - state.lastNotificationAtMs >= options.cooldownMs
    ) {
      nextState = { status: currentStatus, lastNotificationAtMs: evaluatedAtMs };
      shouldNotify = true;
      event = 'REMINDER';
      reason = 'COOLDOWN_ELAPSED';
    } else {
      nextState = { ...state, status: currentStatus };
      reason = 'COOLDOWN_ACTIVE';
    }

    const nextEligibleReminderAt =
      unhealthy(currentStatus) && nextState.lastNotificationAtMs !== null
        ? iso(nextState.lastNotificationAtMs + options.cooldownMs)
        : null;

    return {
      state: Object.freeze({ ...nextState }),
      decision: Object.freeze({
        shouldNotify,
        event,
        reason,
        previousStatus,
        currentStatus,
        evaluatedAt: iso(evaluatedAtMs),
        nextEligibleReminderAt,
      }),
    };
  }

  private validateTimestamp(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('evaluatedAtMs must be a finite positive timestamp');
    }
  }

  private validateOptions(options: ReconciliationAlertingOptions): void {
    if (!Number.isFinite(options.cooldownMs) || options.cooldownMs < 0) {
      throw new Error('cooldownMs must be a finite non-negative number');
    }
  }
}
