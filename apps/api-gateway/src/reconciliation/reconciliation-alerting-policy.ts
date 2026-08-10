import { Injectable } from '@nestjs/common';

import type {
  ReconciliationSloEvaluation,
  ReconciliationSloStatus,
} from './reconciliation-slo-policy';

export type ReconciliationAlertEvent =
  | 'WARNING'
  | 'CRITICAL'
  | 'RECOVERED'
  | 'REMINDER';

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

interface ReconciliationAlertState {
  status: ReconciliationSloStatus | null;
  lastNotificationAtMs: number | null;
}

const unhealthy = (status: ReconciliationSloStatus): status is 'WARNING' | 'CRITICAL' =>
  status === 'WARNING' || status === 'CRITICAL';

const iso = (timestampMs: number): string => new Date(timestampMs).toISOString();

/**
 * Provider-neutral reconciliation alert decision policy.
 *
 * This service deliberately does not call Slack, PagerDuty, SMS, email or any
 * monitoring backend. It only turns SLO evaluations into bounded notification
 * decisions with transition handling and reminder cooldowns.
 *
 * State is process-local by design. A distributed state adapter can replace it
 * later without changing the decision contract exposed by this class.
 */
@Injectable()
export class ReconciliationAlertingPolicy {
  private readonly state: ReconciliationAlertState = {
    status: null,
    lastNotificationAtMs: null,
  };

  public evaluate(
    evaluation: ReconciliationSloEvaluation,
    evaluatedAtMs: number = Date.now(),
    options: ReconciliationAlertingOptions = DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
  ): ReconciliationAlertDecision {
    this.validateTimestamp(evaluatedAtMs);
    this.validateOptions(options);

    const previousStatus = this.state.status;
    const currentStatus = evaluation.status;

    if (currentStatus === 'NO_DATA') {
      this.state.status = currentStatus;
      return this.decision(
        false,
        null,
        'NO_DATA',
        previousStatus,
        currentStatus,
        evaluatedAtMs,
        options,
      );
    }

    if (currentStatus === 'HEALTHY') {
      this.state.status = currentStatus;
      if (previousStatus !== null && unhealthy(previousStatus)) {
        this.state.lastNotificationAtMs = evaluatedAtMs;
        return this.decision(
          true,
          'RECOVERED',
          'STATE_CHANGE',
          previousStatus,
          currentStatus,
          evaluatedAtMs,
          options,
        );
      }
      return this.decision(
        false,
        null,
        'HEALTHY_STEADY',
        previousStatus,
        currentStatus,
        evaluatedAtMs,
        options,
      );
    }

    if (previousStatus !== currentStatus) {
      this.state.status = currentStatus;
      this.state.lastNotificationAtMs = evaluatedAtMs;
      return this.decision(
        true,
        currentStatus,
        'STATE_CHANGE',
        previousStatus,
        currentStatus,
        evaluatedAtMs,
        options,
      );
    }

    const lastNotificationAtMs = this.state.lastNotificationAtMs;
    if (
      lastNotificationAtMs === null ||
      evaluatedAtMs - lastNotificationAtMs >= options.cooldownMs
    ) {
      this.state.status = currentStatus;
      this.state.lastNotificationAtMs = evaluatedAtMs;
      return this.decision(
        true,
        'REMINDER',
        'COOLDOWN_ELAPSED',
        previousStatus,
        currentStatus,
        evaluatedAtMs,
        options,
      );
    }

    this.state.status = currentStatus;
    return this.decision(
      false,
      null,
      'COOLDOWN_ACTIVE',
      previousStatus,
      currentStatus,
      evaluatedAtMs,
      options,
    );
  }

  public reset(): void {
    this.state.status = null;
    this.state.lastNotificationAtMs = null;
  }

  private decision(
    shouldNotify: boolean,
    event: ReconciliationAlertEvent | null,
    reason: ReconciliationAlertDecisionReason,
    previousStatus: ReconciliationSloStatus | null,
    currentStatus: ReconciliationSloStatus,
    evaluatedAtMs: number,
    options: ReconciliationAlertingOptions,
  ): ReconciliationAlertDecision {
    const lastNotificationAtMs = this.state.lastNotificationAtMs;
    return Object.freeze({
      shouldNotify,
      event,
      reason,
      previousStatus,
      currentStatus,
      evaluatedAt: iso(evaluatedAtMs),
      nextEligibleReminderAt:
        unhealthy(currentStatus) && lastNotificationAtMs !== null
          ? iso(lastNotificationAtMs + options.cooldownMs)
          : null,
    });
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
