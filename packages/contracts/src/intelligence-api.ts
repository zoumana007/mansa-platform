import type { PageRequest, PageResponse } from './pagination.js';
import type {
  AiConversation,
  AiMessage,
  AskJiniCommand,
  EvaluateTransactionRiskCommand,
  TransactionRiskAssessment,
} from './intelligence.js';

export const INTELLIGENCE_API_ROUTES = {
  askJini: '/v1/intelligence/jini/messages',
  getConversation: '/v1/intelligence/jini/conversations/:conversationId',
  listConversationMessages: '/v1/intelligence/jini/conversations/:conversationId/messages',
  escalateConversation: '/v1/intelligence/jini/conversations/:conversationId/escalation',
  evaluateTransactionRisk: '/v1/intelligence/risk/transactions/evaluate',
  getTransactionRiskAssessment: '/v1/intelligence/risk/assessments/:assessmentId',
} as const;

export const INTELLIGENCE_API_METHODS = {
  askJini: 'POST',
  getConversation: 'GET',
  listConversationMessages: 'GET',
  escalateConversation: 'POST',
  evaluateTransactionRisk: 'POST',
  getTransactionRiskAssessment: 'GET',
} as const;

export type IntelligenceApiRouteName = keyof typeof INTELLIGENCE_API_ROUTES;

export interface AskJiniResponse {
  readonly conversation: AiConversation;
  readonly message: AiMessage;
}

export interface ListConversationMessagesQuery extends PageRequest {
  readonly conversationId: string;
}

export interface EscalateConversationCommand {
  readonly conversationId: string;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface EscalateConversationResponse {
  readonly conversation: AiConversation;
  readonly supportTicketId: string;
}

export interface IntelligenceApiContract {
  readonly askJini: {
    readonly method: typeof INTELLIGENCE_API_METHODS.askJini;
    readonly path: typeof INTELLIGENCE_API_ROUTES.askJini;
    readonly request: AskJiniCommand & { readonly idempotencyKey: string };
    readonly response: AskJiniResponse;
  };
  readonly getConversation: {
    readonly method: typeof INTELLIGENCE_API_METHODS.getConversation;
    readonly path: typeof INTELLIGENCE_API_ROUTES.getConversation;
    readonly request: { readonly conversationId: string };
    readonly response: AiConversation;
  };
  readonly listConversationMessages: {
    readonly method: typeof INTELLIGENCE_API_METHODS.listConversationMessages;
    readonly path: typeof INTELLIGENCE_API_ROUTES.listConversationMessages;
    readonly request: ListConversationMessagesQuery;
    readonly response: PageResponse<AiMessage>;
  };
  readonly escalateConversation: {
    readonly method: typeof INTELLIGENCE_API_METHODS.escalateConversation;
    readonly path: typeof INTELLIGENCE_API_ROUTES.escalateConversation;
    readonly request: EscalateConversationCommand;
    readonly response: EscalateConversationResponse;
  };
  readonly evaluateTransactionRisk: {
    readonly method: typeof INTELLIGENCE_API_METHODS.evaluateTransactionRisk;
    readonly path: typeof INTELLIGENCE_API_ROUTES.evaluateTransactionRisk;
    readonly request: EvaluateTransactionRiskCommand & { readonly idempotencyKey: string };
    readonly response: TransactionRiskAssessment;
  };
  readonly getTransactionRiskAssessment: {
    readonly method: typeof INTELLIGENCE_API_METHODS.getTransactionRiskAssessment;
    readonly path: typeof INTELLIGENCE_API_ROUTES.getTransactionRiskAssessment;
    readonly request: { readonly assessmentId: string };
    readonly response: TransactionRiskAssessment;
  };
}
