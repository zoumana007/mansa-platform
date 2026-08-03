export type ComplianceEvidenceType =
  | "DOCUMENT"
  | "TRANSACTION"
  | "SCREENING_RESULT"
  | "ANALYST_NOTE"
  | "EXTERNAL_REFERENCE";

export interface ComplianceEvidence {
  readonly id: string;
  readonly caseId: string;
  readonly type: ComplianceEvidenceType;
  readonly reference: string;
  readonly checksum?: string;
  readonly classification: "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  readonly addedBy: string;
  readonly addedAt: string;
  readonly removedAt?: string;
  readonly removedBy?: string;
  readonly removalReason?: string;
}

export interface AddComplianceEvidenceInput {
  readonly id: string;
  readonly caseId: string;
  readonly type: ComplianceEvidenceType;
  readonly reference: string;
  readonly checksum?: string;
  readonly classification: ComplianceEvidence["classification"];
  readonly actorId: string;
  readonly occurredAt: string;
}

export interface RemoveComplianceEvidenceInput {
  readonly actorId: string;
  readonly occurredAt: string;
  readonly reason: string;
}

export interface ComplianceEvidenceMutation {
  readonly evidence: ComplianceEvidence;
  readonly auditAction: "COMPLIANCE_EVIDENCE_ADDED" | "COMPLIANCE_EVIDENCE_REMOVED";
  readonly actorId: string;
  readonly rationale?: string;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
}

export function addComplianceEvidence(
  input: AddComplianceEvidenceInput,
): ComplianceEvidenceMutation {
  requireText(input.id, "id");
  requireText(input.caseId, "caseId");
  requireText(input.reference, "reference");
  requireText(input.actorId, "actorId");
  requireText(input.occurredAt, "occurredAt");

  if (input.checksum !== undefined) {
    requireText(input.checksum, "checksum");
  }

  return {
    evidence: {
      id: input.id,
      caseId: input.caseId,
      type: input.type,
      reference: input.reference,
      checksum: input.checksum,
      classification: input.classification,
      addedBy: input.actorId,
      addedAt: input.occurredAt,
    },
    auditAction: "COMPLIANCE_EVIDENCE_ADDED",
    actorId: input.actorId,
  };
}

export function removeComplianceEvidence(
  evidence: ComplianceEvidence,
  input: RemoveComplianceEvidenceInput,
): ComplianceEvidenceMutation {
  requireText(input.actorId, "actorId");
  requireText(input.occurredAt, "occurredAt");
  requireText(input.reason, "reason");

  if (evidence.removedAt !== undefined) {
    throw new Error("compliance evidence is already removed");
  }

  return {
    evidence: {
      ...evidence,
      removedAt: input.occurredAt,
      removedBy: input.actorId,
      removalReason: input.reason,
    },
    auditAction: "COMPLIANCE_EVIDENCE_REMOVED",
    actorId: input.actorId,
    rationale: input.reason,
  };
}

export function isComplianceEvidenceActive(evidence: ComplianceEvidence): boolean {
  return evidence.removedAt === undefined;
}
