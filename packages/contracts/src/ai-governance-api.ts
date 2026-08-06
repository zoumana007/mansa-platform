import type {
  AiDecisionTrace,
  AiModelStatus,
  AiModelVersion,
  AiUseCase,
  ChangeAiModelStatusCommand,
  RegisterAiModelVersionCommand,
} from './ai-governance.js';

export const AI_GOVERNANCE_API_ROUTES = {
  models: '/v1/ai/models',
  modelVersion: '/v1/ai/models/:modelId/versions/:version',
  modelStatus: '/v1/ai/models/:modelId/versions/:version/status',
  decisions: '/v1/ai/decisions',
  decision: '/v1/ai/decisions/:decisionId',
} as const;

export const AI_GOVERNANCE_API_METHODS = {
  listModels: 'GET',
  registerModelVersion: 'POST',
  getModelVersion: 'GET',
  changeModelStatus: 'POST',
  listDecisions: 'GET',
  getDecision: 'GET',
} as const;

export type AiGovernanceApiRouteName = keyof typeof AI_GOVERNANCE_API_ROUTES;

export interface ListAiModelsQuery {
  readonly useCase?: AiUseCase;
  readonly status?: AiModelStatus;
  readonly provider?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ListAiDecisionsQuery {
  readonly useCase?: AiUseCase;
  readonly modelId?: string;
  readonly modelVersion?: string;
  readonly subjectType?: string;
  readonly subjectId?: string;
  readonly correlationId?: string;
  readonly humanReviewRequired?: boolean;
  readonly decidedFrom?: string;
  readonly decidedTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface AiGovernancePage<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

export interface AiGovernanceApiContract {
  readonly listModels: {
    readonly method: typeof AI_GOVERNANCE_API_METHODS.listModels;
    readonly route: typeof AI_GOVERNANCE_API_ROUTES.models;
    readonly query: ListAiModelsQuery;
    readonly response: AiGovernancePage<AiModelVersion>;
  };
  readonly registerModelVersion: {
    readonly method: typeof AI_GOVERNANCE_API_METHODS.registerModelVersion;
    readonly route: typeof AI_GOVERNANCE_API_ROUTES.models;
    readonly body: RegisterAiModelVersionCommand;
    readonly response: AiModelVersion;
  };
  readonly getModelVersion: {
    readonly method: typeof AI_GOVERNANCE_API_METHODS.getModelVersion;
    readonly route: typeof AI_GOVERNANCE_API_ROUTES.modelVersion;
    readonly response: AiModelVersion;
  };
  readonly changeModelStatus: {
    readonly method: typeof AI_GOVERNANCE_API_METHODS.changeModelStatus;
    readonly route: typeof AI_GOVERNANCE_API_ROUTES.modelStatus;
    readonly body: ChangeAiModelStatusCommand;
    readonly response: AiModelVersion;
  };
  readonly listDecisions: {
    readonly method: typeof AI_GOVERNANCE_API_METHODS.listDecisions;
    readonly route: typeof AI_GOVERNANCE_API_ROUTES.decisions;
    readonly query: ListAiDecisionsQuery;
    readonly response: AiGovernancePage<AiDecisionTrace>;
  };
  readonly getDecision: {
    readonly method: typeof AI_GOVERNANCE_API_METHODS.getDecision;
    readonly route: typeof AI_GOVERNANCE_API_ROUTES.decision;
    readonly response: AiDecisionTrace;
  };
}
