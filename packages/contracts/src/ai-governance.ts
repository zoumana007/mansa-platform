export const AI_USE_CASES = ['JINI_ASSISTANT', 'FRAUD_SCORING', 'SUPPORT_TRIAGE', 'RECOMMENDATION'] as const;
export const AI_MODEL_STATUSES = ['DRAFT', 'SHADOW', 'ACTIVE', 'SUSPENDED', 'RETIRED'] as const;
export const AI_DECISION_OUTCOMES = ['ALLOW', 'REVIEW', 'STEP_UP', 'BLOCK', 'REFUSE'] as const;

export type AiUseCase = (typeof AI_USE_CASES)[number];
export type AiModelStatus = (typeof AI_MODEL_STATUSES)[number];
export type AiDecisionOutcome = (typeof AI_DECISION_OUTCOMES)[number];

export interface AiModelVersion {
  readonly modelId: string;
  readonly version: string;
  readonly useCase: AiUseCase;
  readonly status: AiModelStatus;
  readonly provider: string;
  readonly dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  readonly deployedAt?: string;
  readonly retiredAt?: string;
}

export interface AiDecisionTrace {
  readonly decisionId: string;
  readonly useCase: AiUseCase;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly outcome: AiDecisionOutcome;
  readonly score?: number;
  readonly reasonCodes: readonly string[];
  readonly correlationId: string;
  readonly decidedAt: string;
  readonly humanReviewRequired: boolean;
}

export interface RegisterAiModelVersionCommand {
  readonly modelId: string;
  readonly version: string;
  readonly useCase: AiUseCase;
  readonly provider: string;
  readonly dataClassification: AiModelVersion['dataClassification'];
  readonly idempotencyKey: string;
}

export interface ChangeAiModelStatusCommand {
  readonly modelId: string;
  readonly version: string;
  readonly targetStatus: Exclude<AiModelStatus, 'DRAFT'>;
  readonly reason: string;
  readonly approvalRequestId?: string;
  readonly idempotencyKey: string;
}

export function isAiUseCase(value: string): value is AiUseCase {
  return AI_USE_CASES.includes(value as AiUseCase);
}

export function isAiModelStatus(value: string): value is AiModelStatus {
  return AI_MODEL_STATUSES.includes(value as AiModelStatus);
}

export function requiresHumanReview(outcome: AiDecisionOutcome): boolean {
  return outcome === 'REVIEW' || outcome === 'STEP_UP' || outcome === 'BLOCK' || outcome === 'REFUSE';
}
