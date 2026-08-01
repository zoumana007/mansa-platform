export const KYC_STATUSES = [
  "not_started",
  "in_progress",
  "pending_review",
  "verified",
  "rejected",
  "expired",
  "suspended",
] as const;

export type KycStatus = (typeof KYC_STATUSES)[number];

export class InvalidKycTransitionError extends Error {
  constructor(from: KycStatus, to: KycStatus) {
    super(`invalid KYC transition from ${from} to ${to}`);
    this.name = "InvalidKycTransitionError";
  }
}

const TRANSITIONS: Readonly<Record<KycStatus, ReadonlySet<KycStatus>>> = {
  not_started: new Set(["in_progress"]),
  in_progress: new Set(["pending_review", "not_started"]),
  pending_review: new Set(["verified", "rejected", "in_progress"]),
  verified: new Set(["expired", "suspended"]),
  rejected: new Set(["in_progress"]),
  expired: new Set(["in_progress", "suspended"]),
  suspended: new Set(["in_progress", "verified", "rejected"]),
};

export function isKycStatus(value: string): value is KycStatus {
  return (KYC_STATUSES as readonly string[]).includes(value);
}

export class KycState {
  private constructor(public readonly status: KycStatus) {}

  static create(status: KycStatus = "not_started"): KycState {
    return new KycState(status);
  }

  canTransitionTo(next: KycStatus): boolean {
    return this.status === next || TRANSITIONS[this.status].has(next);
  }

  transitionTo(next: KycStatus): KycState {
    if (!this.canTransitionTo(next)) {
      throw new InvalidKycTransitionError(this.status, next);
    }

    return new KycState(next);
  }

  isVerified(): boolean {
    return this.status === "verified";
  }

  requiresAction(): boolean {
    return ["not_started", "in_progress", "rejected", "expired", "suspended"].includes(
      this.status,
    );
  }

  toJSON(): { status: KycStatus; verified: boolean; requiresAction: boolean } {
    return {
      status: this.status,
      verified: this.isVerified(),
      requiresAction: this.requiresAction(),
    };
  }
}
