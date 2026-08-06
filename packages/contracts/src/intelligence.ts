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

export interface RiskAssessmentValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function isRiskDecision(value: string): value is RiskDecision {
  return (RISK_DECISIONS as readonly string[]).includes(value);
}

export function isRiskLevel(value: string): value is RiskLevel {
  return (RISK_LEVELS as readonly string[]).includes(value);
}

export function riskLevelForScore(score: number): RiskLevel {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error('riskScore must be an integer between 0 and 100');
  }

  if (score < 30) return 'LOW';
  if (score < 60) return 'MEDIUM';
  if (score < 85) return 'HIGH';
  return 'CRITICAL';
}

export function validateTransactionRiskAssessment(
  assessment: TransactionRiskAssessment,
): RiskAssessmentValidationResult {
  const errors: string[] = [];

  if (!assessment.assessmentId.trim()) errors.push('assessmentId is required');
  if (!assessment.transactionId.trim()) errors.push('transactionId is required');
  if (!assessment.modelVersion.trim()) errors.push('modelVersion is required');
  if (!assessment.assessedAt.trim()) errors.push('assessedAt is required');

  if (!Number.isInteger(assessment.riskScore) || assessment.riskScore < 0 || assessment.riskScore > 100) {
    errors.push('riskScore must be an integer between 0 and 100');
  } else if (riskLevelForScore(assessment.riskScore) !== assessment.riskLevel) {
    errors.push('riskLevel is inconsistent with riskScore');
  }

  if (assessment.riskLevel === 'CRITICAL' && assessment.decision === 'ALLOW') {
    errors.push('CRITICAL assessments cannot be allowed');
  }

  if (assessment.riskLevel === 'LOW' && assessment.decision === 'BLOCK') {
    errors.push('LOW assessments cannot be blocked');
  }

  for (const signal of assessment.signals) {
    if (!signal.code.trim()) errors.push('risk signal code is required');
    if (!Number.isFinite(signal.score) || signal.score < 0 || signal.score > 100) {
      errors.push(`risk signal ${signal.code || '<unknown>'} score must be between 0 and 100`);
    }
  }

  return { valid: errors.length === 0, errors };
}
