import { Inject, Injectable } from '@nestjs/common';

import type {
  ReconciliationAlertDecision,
  ReconciliationAlertEvent,
  ReconciliationAlertingOptions,
} from './reconciliation-alerting-policy';
import {
  DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
  ReconciliationAlertingPolicy,
} from './reconciliation-alerting-policy';
import type { ReconciliationSloEvaluation } from './reconciliation-slo-policy';

export const RECONCILIATION_ALERT_SINK = Symbol('RECONCILIATION_ALERT_SINK');

export interface ReconciliationAlertPayload {
  readonly event: ReconciliationAlertEvent;
  readonly status: ReconciliationSloEvaluation['status'];
  readonly evaluatedAt: string;
  readonly previousStatus: ReconciliationAlertDecision['previousStatus'];
  readonly breaches: ReconciliationSloEvaluation['breaches'];
  readonly sli: ReconciliationSloEvaluation['sli'];
}

export interface ReconciliationAlertSink {
  send(payload: ReconciliationAlertPayload): Promise<void>;
}

@Injectable()
export class NoopReconciliationAlertSink implements ReconciliationAlertSink {
  public async send(_payload: ReconciliationAlertPayload): Promise<void> {
    return Promise.resolve();
  }
}

export interface ReconciliationAlertDispatchResult {
  readonly decision: ReconciliationAlertDecision;
  readonly delivered: boolean;
}

@Injectable()
export class ReconciliationAlertDispatcher {
  public constructor(
    private readonly policy: ReconciliationAlertingPolicy,
    @Inject(RECONCILIATION_ALERT_SINK)
    private readonly sink: ReconciliationAlertSink,
  ) {}

  public async dispatch(
    evaluation: ReconciliationSloEvaluation,
    evaluatedAtMs: number = Date.now(),
    options: ReconciliationAlertingOptions = DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
  ): Promise<ReconciliationAlertDispatchResult> {
    const decision = await this.policy.evaluateShared(evaluation, evaluatedAtMs, options);

    if (!decision.shouldNotify || decision.event === null) {
      return Object.freeze({ decision, delivered: false });
    }

    const payload: ReconciliationAlertPayload = Object.freeze({
      event: decision.event,
      status: evaluation.status,
      evaluatedAt: decision.evaluatedAt,
      previousStatus: decision.previousStatus,
      breaches: evaluation.breaches,
      sli: evaluation.sli,
    });

    await this.sink.send(payload);

    return Object.freeze({ decision, delivered: true });
  }
}
