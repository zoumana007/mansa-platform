import type { AuthorizationScope, Environment, Permission } from "./index.js";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface ApprovalRequest {
  readonly approvalId: string;
  readonly actionType: string;
  readonly permission: Permission;
  readonly initiatorActorId: string;
  readonly environment: Environment;
  readonly scope: AuthorizationScope;
  readonly justification: string;
  readonly correlationId: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly status: ApprovalStatus;
  readonly decidedByActorId?: string;
  readonly decisionComment?: string;
  readonly decidedAt?: Date;
}

export type ApprovalTransitionError =
  | "REQUEST_NOT_PENDING"
  | "REQUEST_EXPIRED"
  | "SELF_APPROVAL_FORBIDDEN"
  | "REJECTION_REASON_REQUIRED"
  | "ONLY_INITIATOR_CAN_CANCEL";

export type ApprovalTransitionResult =
  | { readonly ok: true; readonly request: ApprovalRequest }
  | { readonly ok: false; readonly reason: ApprovalTransitionError };

function isExpired(request: ApprovalRequest, now: Date): boolean {
  return now.getTime() >= request.expiresAt.getTime();
}

function ensurePending(
  request: ApprovalRequest,
  now: Date,
): ApprovalTransitionResult | undefined {
  if (request.status !== "PENDING") {
    return { ok: false, reason: "REQUEST_NOT_PENDING" };
  }

  if (isExpired(request, now)) {
    return { ok: false, reason: "REQUEST_EXPIRED" };
  }

  return undefined;
}

export function expireApprovalRequest(
  request: ApprovalRequest,
  now: Date,
): ApprovalRequest {
  if (request.status !== "PENDING" || !isExpired(request, now)) {
    return request;
  }

  return { ...request, status: "EXPIRED", decidedAt: now };
}

export function approveRequest(
  request: ApprovalRequest,
  approverActorId: string,
  now: Date,
  comment?: string,
): ApprovalTransitionResult {
  const pendingError = ensurePending(request, now);
  if (pendingError !== undefined) {
    return pendingError;
  }

  if (approverActorId === request.initiatorActorId) {
    return { ok: false, reason: "SELF_APPROVAL_FORBIDDEN" };
  }

  return {
    ok: true,
    request: {
      ...request,
      status: "APPROVED",
      decidedByActorId: approverActorId,
      decisionComment: comment,
      decidedAt: now,
    },
  };
}

export function rejectRequest(
  request: ApprovalRequest,
  reviewerActorId: string,
  reason: string,
  now: Date,
): ApprovalTransitionResult {
  const pendingError = ensurePending(request, now);
  if (pendingError !== undefined) {
    return pendingError;
  }

  if (reviewerActorId === request.initiatorActorId) {
    return { ok: false, reason: "SELF_APPROVAL_FORBIDDEN" };
  }

  if (reason.trim().length === 0) {
    return { ok: false, reason: "REJECTION_REASON_REQUIRED" };
  }

  return {
    ok: true,
    request: {
      ...request,
      status: "REJECTED",
      decidedByActorId: reviewerActorId,
      decisionComment: reason.trim(),
      decidedAt: now,
    },
  };
}

export function cancelRequest(
  request: ApprovalRequest,
  actorId: string,
  now: Date,
  comment?: string,
): ApprovalTransitionResult {
  const pendingError = ensurePending(request, now);
  if (pendingError !== undefined) {
    return pendingError;
  }

  if (actorId !== request.initiatorActorId) {
    return { ok: false, reason: "ONLY_INITIATOR_CAN_CANCEL" };
  }

  return {
    ok: true,
    request: {
      ...request,
      status: "CANCELLED",
      decidedByActorId: actorId,
      decisionComment: comment,
      decidedAt: now,
    },
  };
}
