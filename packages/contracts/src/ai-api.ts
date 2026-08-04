import type { ApiErrorResponse, ApiSuccessResponse } from './api-response.js';

export const AI_API_PREFIX = '/v1/ai' as const;

export const AI_API_ROUTES = {
  createConversation: `${AI_API_PREFIX}/conversations`,
  listConversations: `${AI_API_PREFIX}/conversations`,
  getConversation: `${AI_API_PREFIX}/conversations/:conversationId`,
  sendMessage: `${AI_API_PREFIX}/conversations/:conversationId/messages`,
  submitFeedback: `${AI_API_PREFIX}/messages/:messageId/feedback`,
  createFraudAssessment: `${AI_API_PREFIX}/fraud/assessments`,
  getFraudAssessment: `${AI_API_PREFIX}/fraud/assessments/:assessmentId`,
  listModelVersions: `${AI_API_PREFIX}/models`,
} as const;

export const AI_API_METHODS = {
  createConversation: 'POST',
  listConversations: 'GET',
  getConversation: 'GET',
  sendMessage: 'POST',
  submitFeedback: 'POST',
  createFraudAssessment: 'POST',
  getFraudAssessment: 'GET',
  listModelVersions: 'GET',
} as const;

export type AiConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
export type AiMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type AiMessageStatus = 'PENDING' | 'COMPLETED' | 'REFUSED' | 'FAILED';
export type AiFeedbackRating = 'HELPFUL' | 'NOT_HELPFUL' | 'UNSAFE';
export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AiModelStatus = 'DRAFT' | 'SHADOW' | 'ACTIVE' | 'RETIRED';

export interface AiConversationData {
  readonly conversationId: string;
  readonly ownerId: string;
  readonly status: AiConversationStatus;
  readonly locale: string;
  readonly title?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AiMessageData {
  readonly messageId: string;
  readonly conversationId: string;
  readonly role: AiMessageRole;
  readonly status: AiMessageStatus;
  readonly content: string;
  readonly modelVersion?: string;
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface CreateAiConversationRequest {
  readonly locale: string;
  readonly title?: string;
  readonly idempotencyKey: string;
}

export type CreateAiConversationResponse = ApiSuccessResponse<AiConversationData>;

export interface ListAiConversationsData {
  readonly items: readonly AiConversationData[];
  readonly nextCursor?: string;
}

export type ListAiConversationsResponse = ApiSuccessResponse<ListAiConversationsData>;

export interface AiConversationDetailData extends AiConversationData {
  readonly messages: readonly AiMessageData[];
}

export type GetAiConversationResponse = ApiSuccessResponse<AiConversationDetailData>;

export interface SendAiMessageRequest {
  readonly content: string;
  readonly locale: string;
  readonly contextReferences?: readonly string[];
  readonly idempotencyKey: string;
}

export type SendAiMessageResponse = ApiSuccessResponse<AiMessageData>;

export interface SubmitAiFeedbackRequest {
  readonly rating: AiFeedbackRating;
  readonly comment?: string;
  readonly idempotencyKey: string;
}

export interface AiFeedbackData {
  readonly feedbackId: string;
  readonly messageId: string;
  readonly rating: AiFeedbackRating;
  readonly createdAt: string;
}

export type SubmitAiFeedbackResponse = ApiSuccessResponse<AiFeedbackData>;

export interface CreateFraudAssessmentRequest {
  readonly subjectType: 'TRANSACTION' | 'ACCOUNT' | 'DEVICE' | 'MERCHANT';
  readonly subjectId: string;
  readonly signals: Readonly<Record<string, string | number | boolean>>;
  readonly idempotencyKey: string;
}

export interface FraudAssessmentData {
  readonly assessmentId: string;
  readonly subjectType: CreateFraudAssessmentRequest['subjectType'];
  readonly subjectId: string;
  readonly riskLevel: FraudRiskLevel;
  readonly score: number;
  readonly reasonCodes: readonly string[];
  readonly recommendedAction: 'ALLOW' | 'REVIEW' | 'STEP_UP' | 'BLOCK';
  readonly modelVersion: string;
  readonly createdAt: string;
}

export type CreateFraudAssessmentResponse = ApiSuccessResponse<FraudAssessmentData>;
export type GetFraudAssessmentResponse = ApiSuccessResponse<FraudAssessmentData>;

export interface AiModelVersionData {
  readonly modelId: string;
  readonly version: string;
  readonly purpose: 'ASSISTANT' | 'FRAUD' | 'SUPPORT' | 'RECOMMENDATION';
  readonly status: AiModelStatus;
  readonly deployedAt?: string;
  readonly retiredAt?: string;
}

export interface ListAiModelVersionsData {
  readonly items: readonly AiModelVersionData[];
}

export type ListAiModelVersionsResponse = ApiSuccessResponse<ListAiModelVersionsData>;
export type AiApiErrorResponse = ApiErrorResponse;
