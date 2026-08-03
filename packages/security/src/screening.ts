export type ScreeningEntityType = "PERSON" | "ORGANIZATION";

export type ScreeningList =
  | "SANCTIONS"
  | "PEP"
  | "INTERNAL_BLOCKLIST"
  | "ADVERSE_MEDIA";

export interface ScreeningMatch {
  readonly id: string;
  readonly list: ScreeningList;
  readonly score: number;
  readonly sourceReference: string;
  readonly active: boolean;
}

export interface ScreeningRequest {
  readonly entityId: string;
  readonly entityType: ScreeningEntityType;
  readonly matches: readonly ScreeningMatch[];
  readonly reviewThreshold: number;
  readonly blockThreshold: number;
}

export type ScreeningDecision =
  | {
      readonly outcome: "CLEAR";
      readonly reason: "NO_RELEVANT_MATCH";
      readonly matchedIds: readonly string[];
    }
  | {
      readonly outcome: "REVIEW";
      readonly reason: "MANUAL_REVIEW_REQUIRED";
      readonly matchedIds: readonly string[];
    }
  | {
      readonly outcome: "BLOCK";
      readonly reason: "BLOCKING_MATCH";
      readonly matchedIds: readonly string[];
    };

function validateThreshold(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be between 0 and 100`);
  }
}

export function evaluateScreening(
  request: ScreeningRequest,
): ScreeningDecision {
  validateThreshold(request.reviewThreshold, "reviewThreshold");
  validateThreshold(request.blockThreshold, "blockThreshold");

  if (request.blockThreshold < request.reviewThreshold) {
    throw new RangeError(
      "blockThreshold must be greater than or equal to reviewThreshold",
    );
  }

  const activeMatches = request.matches.filter((match) => match.active);
  for (const match of activeMatches) {
    validateThreshold(match.score, `match ${match.id} score`);
  }

  const blockingMatches = activeMatches.filter(
    (match) =>
      match.list === "SANCTIONS" ||
      match.list === "INTERNAL_BLOCKLIST" ||
      match.score >= request.blockThreshold,
  );

  if (blockingMatches.length > 0) {
    return {
      outcome: "BLOCK",
      reason: "BLOCKING_MATCH",
      matchedIds: blockingMatches.map((match) => match.id),
    };
  }

  const reviewMatches = activeMatches.filter(
    (match) => match.score >= request.reviewThreshold,
  );

  if (reviewMatches.length > 0) {
    return {
      outcome: "REVIEW",
      reason: "MANUAL_REVIEW_REQUIRED",
      matchedIds: reviewMatches.map((match) => match.id),
    };
  }

  return {
    outcome: "CLEAR",
    reason: "NO_RELEVANT_MATCH",
    matchedIds: [],
  };
}
