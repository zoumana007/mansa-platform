export type MonitoringSignalType =
  | "STRUCTURING"
  | "RAPID_MOVEMENT"
  | "UNUSUAL_AMOUNT"
  | "HIGH_RISK_COUNTRY"
  | "DORMANT_ACCOUNT_ACTIVITY"
  | "MANY_BENEFICIARIES";

export interface MonitoringSignal {
  readonly id: string;
  readonly type: MonitoringSignalType;
  readonly score: number;
  readonly active: boolean;
  readonly sourceReference: string;
}

export interface TransactionMonitoringRequest {
  readonly transactionId: string;
  readonly customerId: string;
  readonly signals: readonly MonitoringSignal[];
  readonly reviewThreshold: number;
  readonly blockThreshold: number;
  readonly mandatoryBlockSignals?: readonly MonitoringSignalType[];
}

export type TransactionMonitoringDecision =
  | {
      readonly outcome: "ALLOW";
      readonly reason: "NO_RELEVANT_SIGNAL";
      readonly signalIds: readonly string[];
      readonly aggregateScore: number;
    }
  | {
      readonly outcome: "REVIEW";
      readonly reason: "MANUAL_REVIEW_REQUIRED";
      readonly signalIds: readonly string[];
      readonly aggregateScore: number;
    }
  | {
      readonly outcome: "BLOCK";
      readonly reason: "BLOCKING_RISK_SIGNAL";
      readonly signalIds: readonly string[];
      readonly aggregateScore: number;
    };

function validateScore(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be between 0 and 100`);
  }
}

export function evaluateTransactionMonitoring(
  request: TransactionMonitoringRequest,
): TransactionMonitoringDecision {
  validateScore(request.reviewThreshold, "reviewThreshold");
  validateScore(request.blockThreshold, "blockThreshold");

  if (request.blockThreshold < request.reviewThreshold) {
    throw new RangeError(
      "blockThreshold must be greater than or equal to reviewThreshold",
    );
  }

  const activeSignals = request.signals.filter((signal) => signal.active);
  for (const signal of activeSignals) {
    validateScore(signal.score, `signal ${signal.id} score`);
  }

  const aggregateScore = Math.min(
    100,
    activeSignals.reduce((total, signal) => total + signal.score, 0),
  );
  const mandatoryBlockSignals = new Set(request.mandatoryBlockSignals ?? []);
  const blockingSignals = activeSignals.filter(
    (signal) =>
      mandatoryBlockSignals.has(signal.type) ||
      signal.score >= request.blockThreshold,
  );

  if (blockingSignals.length > 0 || aggregateScore >= request.blockThreshold) {
    return {
      outcome: "BLOCK",
      reason: "BLOCKING_RISK_SIGNAL",
      signalIds:
        blockingSignals.length > 0
          ? blockingSignals.map((signal) => signal.id)
          : activeSignals.map((signal) => signal.id),
      aggregateScore,
    };
  }

  const reviewSignals = activeSignals.filter(
    (signal) => signal.score >= request.reviewThreshold,
  );

  if (reviewSignals.length > 0 || aggregateScore >= request.reviewThreshold) {
    return {
      outcome: "REVIEW",
      reason: "MANUAL_REVIEW_REQUIRED",
      signalIds:
        reviewSignals.length > 0
          ? reviewSignals.map((signal) => signal.id)
          : activeSignals.map((signal) => signal.id),
      aggregateScore,
    };
  }

  return {
    outcome: "ALLOW",
    reason: "NO_RELEVANT_SIGNAL",
    signalIds: [],
    aggregateScore,
  };
}
