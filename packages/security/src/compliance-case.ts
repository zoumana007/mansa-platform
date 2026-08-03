export type ComplianceCaseStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type ComplianceCasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ComplianceCase {
  readonly id: string;
  readonly subjectId: string;
  readonly sourceType: "TRANSACTION_MONITORING" | "SCREENING" | "MANUAL";
  readonly sourceReference: string;
  readonly status: ComplianceCaseStatus;
  readonly priority: ComplianceCasePriority;
  readonly ownerId?: string;
  readonly resolutionCode?: string;
  readonly updatedAt: string;
}

export type ComplianceCaseCommand =
  | {
      readonly type: "ASSIGN";
      readonly actorId: string;
      readonly ownerId: string;
      readonly occurredAt: string;
    }
  | {
      readonly type: "START_REVIEW";
      readonly actorId: string;
      readonly occurredAt: string;
    }
  | {
      readonly type: "ESCALATE";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly reason: string;
    }
  | {
      readonly type: "RESOLVE";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly resolutionCode: string;
      readonly rationale: string;
    }
  | {
      readonly type: "CLOSE";
      readonly actorId: string;
      readonly occurredAt: string;
    }
  | {
      readonly type: "REOPEN";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly reason: string;
    };

export interface ComplianceCaseTransition {
  readonly case: ComplianceCase;
  readonly auditAction: string;
  readonly actorId: string;
  readonly rationale?: string;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
}

function requireOpenCase(complianceCase: ComplianceCase): void {
  if (complianceCase.status === "CLOSED") {
    throw new Error("closed compliance case must be reopened first");
  }
}

export function transitionComplianceCase(
  complianceCase: ComplianceCase,
  command: ComplianceCaseCommand,
): ComplianceCaseTransition {
  requireText(command.actorId, "actorId");
  requireText(command.occurredAt, "occurredAt");

  switch (command.type) {
    case "ASSIGN": {
      requireOpenCase(complianceCase);
      requireText(command.ownerId, "ownerId");
      return {
        case: { ...complianceCase, ownerId: command.ownerId, updatedAt: command.occurredAt },
        auditAction: "COMPLIANCE_CASE_ASSIGNED",
        actorId: command.actorId,
      };
    }
    case "START_REVIEW": {
      requireOpenCase(complianceCase);
      if (complianceCase.ownerId === undefined) {
        throw new Error("compliance case must be assigned before review");
      }
      if (complianceCase.status !== "OPEN" && complianceCase.status !== "ESCALATED") {
        throw new Error("compliance case cannot enter review from current status");
      }
      return {
        case: { ...complianceCase, status: "IN_REVIEW", updatedAt: command.occurredAt },
        auditAction: "COMPLIANCE_CASE_REVIEW_STARTED",
        actorId: command.actorId,
      };
    }
    case "ESCALATE": {
      requireOpenCase(complianceCase);
      requireText(command.reason, "reason");
      if (complianceCase.status !== "OPEN" && complianceCase.status !== "IN_REVIEW") {
        throw new Error("compliance case cannot be escalated from current status");
      }
      return {
        case: { ...complianceCase, status: "ESCALATED", priority: "CRITICAL", updatedAt: command.occurredAt },
        auditAction: "COMPLIANCE_CASE_ESCALATED",
        actorId: command.actorId,
        rationale: command.reason,
      };
    }
    case "RESOLVE": {
      requireOpenCase(complianceCase);
      requireText(command.resolutionCode, "resolutionCode");
      requireText(command.rationale, "rationale");
      if (complianceCase.status !== "IN_REVIEW" && complianceCase.status !== "ESCALATED") {
        throw new Error("compliance case must be reviewed before resolution");
      }
      return {
        case: {
          ...complianceCase,
          status: "RESOLVED",
          resolutionCode: command.resolutionCode,
          updatedAt: command.occurredAt,
        },
        auditAction: "COMPLIANCE_CASE_RESOLVED",
        actorId: command.actorId,
        rationale: command.rationale,
      };
    }
    case "CLOSE": {
      if (complianceCase.status !== "RESOLVED") {
        throw new Error("only a resolved compliance case can be closed");
      }
      return {
        case: { ...complianceCase, status: "CLOSED", updatedAt: command.occurredAt },
        auditAction: "COMPLIANCE_CASE_CLOSED",
        actorId: command.actorId,
      };
    }
    case "REOPEN": {
      requireText(command.reason, "reason");
      if (complianceCase.status !== "RESOLVED" && complianceCase.status !== "CLOSED") {
        throw new Error("only a resolved or closed compliance case can be reopened");
      }
      return {
        case: {
          ...complianceCase,
          status: "OPEN",
          resolutionCode: undefined,
          updatedAt: command.occurredAt,
        },
        auditAction: "COMPLIANCE_CASE_REOPENED",
        actorId: command.actorId,
        rationale: command.reason,
      };
    }
  }
}
