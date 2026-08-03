export type RegulatoryReportType = "SUSPICIOUS_ACTIVITY" | "THRESHOLD" | "PERIODIC";
export type RegulatoryReportStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "SUBMITTED"
  | "REJECTED"
  | "CANCELLED";

export interface RegulatoryReport {
  readonly id: string;
  readonly caseId: string;
  readonly countryCode: string;
  readonly reportType: RegulatoryReportType;
  readonly authorityCode: string;
  readonly status: RegulatoryReportStatus;
  readonly summary: string;
  readonly preparedBy: string;
  readonly preparedAt: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly submittedBy?: string;
  readonly submittedAt?: string;
  readonly externalReference?: string;
  readonly decisionReason?: string;
}

export interface CreateRegulatoryReportInput {
  readonly id: string;
  readonly caseId: string;
  readonly countryCode: string;
  readonly reportType: RegulatoryReportType;
  readonly authorityCode: string;
  readonly summary: string;
  readonly actorId: string;
  readonly occurredAt: string;
}

export type RegulatoryReportCommand =
  | { readonly type: "REQUEST_REVIEW"; readonly actorId: string; readonly occurredAt: string }
  | { readonly type: "APPROVE"; readonly actorId: string; readonly occurredAt: string; readonly reason: string }
  | { readonly type: "REJECT"; readonly actorId: string; readonly occurredAt: string; readonly reason: string }
  | {
      readonly type: "MARK_SUBMITTED";
      readonly actorId: string;
      readonly occurredAt: string;
      readonly externalReference: string;
    }
  | { readonly type: "CANCEL"; readonly actorId: string; readonly occurredAt: string; readonly reason: string };

export interface RegulatoryReportMutation {
  readonly report: RegulatoryReport;
  readonly auditAction:
    | "REGULATORY_REPORT_CREATED"
    | "REGULATORY_REPORT_REVIEW_REQUESTED"
    | "REGULATORY_REPORT_APPROVED"
    | "REGULATORY_REPORT_REJECTED"
    | "REGULATORY_REPORT_SUBMITTED"
    | "REGULATORY_REPORT_CANCELLED";
  readonly actorId: string;
  readonly rationale: string;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} is required`);
}

export function createRegulatoryReport(input: CreateRegulatoryReportInput): RegulatoryReportMutation {
  requireText(input.id, "id");
  requireText(input.caseId, "caseId");
  requireText(input.countryCode, "countryCode");
  requireText(input.authorityCode, "authorityCode");
  requireText(input.summary, "summary");
  requireText(input.actorId, "actorId");
  requireText(input.occurredAt, "occurredAt");

  return {
    report: {
      id: input.id,
      caseId: input.caseId,
      countryCode: input.countryCode,
      reportType: input.reportType,
      authorityCode: input.authorityCode,
      status: "DRAFT",
      summary: input.summary,
      preparedBy: input.actorId,
      preparedAt: input.occurredAt,
    },
    auditAction: "REGULATORY_REPORT_CREATED",
    actorId: input.actorId,
    rationale: input.summary,
  };
}

export function transitionRegulatoryReport(
  report: RegulatoryReport,
  command: RegulatoryReportCommand,
): RegulatoryReportMutation {
  requireText(command.actorId, "actorId");
  requireText(command.occurredAt, "occurredAt");

  if (report.status === "SUBMITTED" || report.status === "REJECTED" || report.status === "CANCELLED") {
    throw new Error("a final regulatory report cannot be changed");
  }

  if (command.type === "REQUEST_REVIEW") {
    if (report.status !== "DRAFT") throw new Error("only a draft report can request review");
    return {
      report: { ...report, status: "READY_FOR_REVIEW" },
      auditAction: "REGULATORY_REPORT_REVIEW_REQUESTED",
      actorId: command.actorId,
      rationale: "review requested",
    };
  }

  if (command.type === "APPROVE") {
    requireText(command.reason, "reason");
    if (report.status !== "READY_FOR_REVIEW") throw new Error("only a report ready for review can be approved");
    if (command.actorId === report.preparedBy) throw new Error("regulatory report requires a different approver");
    return {
      report: {
        ...report,
        status: "APPROVED",
        reviewedBy: command.actorId,
        reviewedAt: command.occurredAt,
        decisionReason: command.reason,
      },
      auditAction: "REGULATORY_REPORT_APPROVED",
      actorId: command.actorId,
      rationale: command.reason,
    };
  }

  if (command.type === "REJECT") {
    requireText(command.reason, "reason");
    if (report.status !== "READY_FOR_REVIEW") throw new Error("only a report ready for review can be rejected");
    if (command.actorId === report.preparedBy) throw new Error("regulatory report requires a different reviewer");
    return {
      report: {
        ...report,
        status: "REJECTED",
        reviewedBy: command.actorId,
        reviewedAt: command.occurredAt,
        decisionReason: command.reason,
      },
      auditAction: "REGULATORY_REPORT_REJECTED",
      actorId: command.actorId,
      rationale: command.reason,
    };
  }

  if (command.type === "MARK_SUBMITTED") {
    requireText(command.externalReference, "externalReference");
    if (report.status !== "APPROVED") throw new Error("only an approved report can be submitted");
    return {
      report: {
        ...report,
        status: "SUBMITTED",
        submittedBy: command.actorId,
        submittedAt: command.occurredAt,
        externalReference: command.externalReference,
      },
      auditAction: "REGULATORY_REPORT_SUBMITTED",
      actorId: command.actorId,
      rationale: command.externalReference,
    };
  }

  requireText(command.reason, "reason");
  if (report.status === "APPROVED") throw new Error("an approved report cannot be cancelled");
  return {
    report: { ...report, status: "CANCELLED", decisionReason: command.reason },
    auditAction: "REGULATORY_REPORT_CANCELLED",
    actorId: command.actorId,
    rationale: command.reason,
  };
}

export function isRegulatoryReportFinal(report: RegulatoryReport): boolean {
  return report.status === "SUBMITTED" || report.status === "REJECTED" || report.status === "CANCELLED";
}
