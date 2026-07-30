export const AI_CONVERSATION_STATUSES = ['ACTIVE', 'ESCALATED', 'CLOSED'] as const;
export type AiConversationStatus = (typeof AI_CONVERSATION_STATUSES)[number];

export const AI_MESSAGE_ROLES = ['USER', 'ASSISTANT', 'SYSTEM', 'AGENT'] as const;
export type AiMessageRole = (typeof AI_MESSAGE_ROLES)[number];

export const RISK_DECISIONS = ['ALLOW', 'REVIEW', 'CHALLENGE', 'BLOCK'] as const;
export type RiskDecision = (typeof RISK_DECISIONS)[number];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface AiConversationContext {
  readonly userId: string;
  readonly locale: string;
  readonly countryCode: string;
  readonly channel: 'CLIENT_APP' | 'MERCHANT_APP' | 'ADMIN' | 'SUPPORT';
  readonly sessionId?: string;
}

export interface AskJiniCommand {
  readonly conversationId?: string;
  readonly message: string;
  readonly context: AiConversationContext;
  readonly correlationId?: string;
}

export interface AiMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly role: AiMessageRole;
  readonly content: string;
  readonly createdAt: string;
  readonly sources?: readonly string[];
  readonly safetyFlags?: readonly string[];
}

export interface AiConversation {
  readonly id: string;
  readonly status: AiConversationStatus;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly escalatedTicketId?: string;
}

export interface RiskSignal {
  readonly code: string;
  readonly score: number;
  readonly description?: string;
}

export interface EvaluateTransactionRiskCommand {
  readonly transactionId: string;
  readonly userId: string;
  readonly amountMinor: string;
  readonly currency: string;
  readonly channel: string;
  readonly occurredAt: string;
  readonly deviceId?: string;
  readonly ipAddress?: string;
  readonly locationCountryCode?: string;
}

export interface TransactionRiskAssessment {
  readonly assessmentId: string;
  readonly transactionId: string;
  readonly riskScore: number;
  readonly riskLevel: RiskLevel;
  readonly decision: RiskDecision;
  readonly signals: readonly RiskSignal[];
  readonly modelVersion: string;
  readonly assessedAt: string;
  readonly expiresAt?: string;
}

export function isRiskDecision(value: string): value is RiskDecision {
  return (RISK_DECISIONS as readonly string[]).includes(value);
}

export function isRiskLevel(value: string): value is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(value);
}
