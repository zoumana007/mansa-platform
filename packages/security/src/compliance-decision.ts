export type ComplianceDecisionOutcome =
  | "NO_ACTION"
  | "REQUEST_INFORMATION"
  | "RESTRICT_ACCOUNT"
  | "REJECT_OPERATION"
  | "REPORT_SUSPICION";

export type ComplianceDecisionStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ComplianceDecision {
  readonly id: string;
  readonly caseId: string;
  readonly outcome: ComplianceDecisionOutcome;
  readonly rationale: string;
  readonly status: ComplianceDecisionStatus;
  readonly proposedBy: string;
  readonly proposedAt: string;
  readonly decidedBy?: string;
  readonly decidedAt?: string;
  readonly decisionReason?: string;
}

export interface ProposeComplianceDecisionInput {
  readonly id: string;
  readonly caseId: string;
  readonly outcome: ComplianceDecisionOutcome;
  readonly rationale: string;
  readonly actorId: string;
  readonly occurredAt: string;
}

export type ComplianceDecisionCommand =
  | {
      readonly type: "APPROVE";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly reason: string;
    }
  | {
      readonly type: "REJECT";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly reason: string;
    }
  | {
      readonly type: "CANCEL";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly reason: string;
    };

export interface ComplianceDecisionMutation {
  readonly decision: ComplianceDecision;
  readonly auditAction:
    | "COMPLIANCE_DECISION_PROPOSED"
    | "COMPLIANCE_DECISION_APPROVED"
    | "COMPLIANCE_DECISION_REJECTED"
    | "COMPLIANCE_DECISION_CANCELLED";
  readonly actorId: string;
  readonly rationale: string;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
}

export function proposeComplianceDecision(
  input: ProposeComplianceDecisionInput,
): ComplianceDecisionMutation {
  requireText(input.id, "id");
  requireText(input.caseId, "caseId");
  requireText(input.rationale, "rationale");
  requireText(input.actorId, "actorId");
  requireText(input.occurredAt, "occurredAt");

  return {
    decision: {
      id: input.id,
      caseId: input.caseId,
      outcome: input.outcome,
      rationale: input.rationale,
      status: "PROPOSED",
      proposedBy: input.actorId,
      proposedAt: input.occurredAt,
    },
    auditAction: "COMPLIANCE_DECISION_PROPOSED",
    actorId: input.actorId,
    rationale: input.rationale,
  };
}

export function decideComplianceDecision(
  decision: ComplianceDecision,
  command: ComplianceDecisionCommand,
): ComplianceDecisionMutation {
  requireText(command.actorId, "actorId");
  requireText(command.occurredAt, "occurredAt");
  requireText(command.reason, "reason");

  if (decision.status !== "PROPOSED") {
    throw new Error("only a proposed compliance decision can be decided");
  }

  if (command.actorId === decision.proposedBy && command.type !== "CANCEL") {
    throw new Error("compliance decision requires a different approver");
  }

  const status: ComplianceDecisionStatus =
    command.type === "APPROVE" ? "APPROVED" : command.type === "REJECT" ? "REJECTED" : "CANCELLED";

  const auditAction: ComplianceDecisionMutation["auditAction"] =
    command.type === "APPROVE"
      ? "COMPLIANCE_DECISION_APPROVED"
      : command.type === "REJECT"
        ? "COMPLIANCE_DECISION_REJECTED"
        : "COMPLIANCE_DECISION_CANCELLED";

  return {
    decision: {
      ...decision,
      status,
      decidedBy: command.actorId,
      decidedAt: command.occurredAt,
      decisionReason: command.reason,
    },
    auditAction,
    actorId: command.actorId,
    rationale: command.reason,
  };
}

export function isComplianceDecisionFinal(decision: ComplianceDecision): boolean {
  return decision.status !== "PROPOSED";
}
