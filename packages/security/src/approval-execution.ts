import type { ApprovalRequest } from "./approval-workflow.js";

export type ApprovalExecutionStatus =
  | "READY"
  | "EXECUTING"
  | "SUCCEEDED"
  | "FAILED";

export interface ApprovalExecution {
  readonly approvalId: string;
  readonly idempotencyKey: string;
  readonly status: ApprovalExecutionStatus;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly operationReference?: string;
  readonly failureCode?: string;
}

export type BeginApprovalExecutionError =
  | "APPROVAL_NOT_APPROVED"
  | "EXECUTION_ALREADY_STARTED"
  | "IDEMPOTENCY_KEY_REQUIRED";

export type BeginApprovalExecutionResult =
  | { readonly ok: true; readonly execution: ApprovalExecution }
  | { readonly ok: false; readonly reason: BeginApprovalExecutionError };

export type CompleteApprovalExecutionError =
  | "EXECUTION_NOT_STARTED"
  | "EXECUTION_ALREADY_TERMINAL"
  | "OPERATION_REFERENCE_REQUIRED"
  | "FAILURE_CODE_REQUIRED";

export type CompleteApprovalExecutionResult =
  | { readonly ok: true; readonly execution: ApprovalExecution }
  | { readonly ok: false; readonly reason: CompleteApprovalExecutionError };

export function createApprovalExecution(
  approvalId: string,
  idempotencyKey: string,
): ApprovalExecution {
  return {
    approvalId,
    idempotencyKey: idempotencyKey.trim(),
    status: "READY",
  };
}

export function beginApprovalExecution(
  approval: ApprovalRequest,
  execution: ApprovalExecution,
  now: Date,
): BeginApprovalExecutionResult {
  if (approval.status !== "APPROVED") {
    return { ok: false, reason: "APPROVAL_NOT_APPROVED" };
  }

  if (execution.idempotencyKey.length === 0) {
    return { ok: false, reason: "IDEMPOTENCY_KEY_REQUIRED" };
  }

  if (execution.status !== "READY") {
    return { ok: false, reason: "EXECUTION_ALREADY_STARTED" };
  }

  return {
    ok: true,
    execution: {
      ...execution,
      status: "EXECUTING",
      startedAt: now,
    },
  };
}

export function succeedApprovalExecution(
  execution: ApprovalExecution,
  operationReference: string,
  now: Date,
): CompleteApprovalExecutionResult {
  if (execution.status === "READY") {
    return { ok: false, reason: "EXECUTION_NOT_STARTED" };
  }

  if (execution.status !== "EXECUTING") {
    return { ok: false, reason: "EXECUTION_ALREADY_TERMINAL" };
  }

  const normalizedReference = operationReference.trim();
  if (normalizedReference.length === 0) {
    return { ok: false, reason: "OPERATION_REFERENCE_REQUIRED" };
  }

  return {
    ok: true,
    execution: {
      ...execution,
      status: "SUCCEEDED",
      operationReference: normalizedReference,
      completedAt: now,
    },
  };
}

export function failApprovalExecution(
  execution: ApprovalExecution,
  failureCode: string,
  now: Date,
): CompleteApprovalExecutionResult {
  if (execution.status === "READY") {
    return { ok: false, reason: "EXECUTION_NOT_STARTED" };
  }

  if (execution.status !== "EXECUTING") {
    return { ok: false, reason: "EXECUTION_ALREADY_TERMINAL" };
  }

  const normalizedFailureCode = failureCode.trim();
  if (normalizedFailureCode.length === 0) {
    return { ok: false, reason: "FAILURE_CODE_REQUIRED" };
  }

  return {
    ok: true,
    execution: {
      ...execution,
      status: "FAILED",
      failureCode: normalizedFailureCode,
      completedAt: now,
    },
  };
}
