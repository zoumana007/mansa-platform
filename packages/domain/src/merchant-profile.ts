export type MerchantProfileStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "suspended"
  | "rejected"
  | "closed";

export interface MerchantProfileProps {
  id: string;
  ownerId: string;
  legalName: string;
  displayName: string;
  countryCode: string;
  settlementCurrency: string;
  status?: MerchantProfileStatus;
  createdAt?: Date;
}

export class MerchantProfile {
  readonly id: string;
  readonly ownerId: string;
  readonly legalName: string;
  readonly displayName: string;
  readonly countryCode: string;
  readonly settlementCurrency: string;
  readonly createdAt: Date;
  private currentStatus: MerchantProfileStatus;
  private currentReason: string | null = null;

  constructor(props: MerchantProfileProps) {
    const id = props.id.trim();
    const ownerId = props.ownerId.trim();
    const legalName = props.legalName.trim();
    const displayName = props.displayName.trim();
    const countryCode = props.countryCode.trim().toUpperCase();
    const settlementCurrency = props.settlementCurrency.trim().toUpperCase();

    if (!id) throw new Error("Merchant profile id is required");
    if (!ownerId) throw new Error("Merchant owner id is required");
    if (!legalName) throw new Error("Merchant legal name is required");
    if (!displayName) throw new Error("Merchant display name is required");
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error("Merchant country must be an ISO 3166-1 alpha-2 code");
    }
    if (!/^[A-Z]{3}$/.test(settlementCurrency)) {
      throw new Error("Merchant settlement currency must be an ISO 4217 code");
    }

    this.id = id;
    this.ownerId = ownerId;
    this.legalName = legalName;
    this.displayName = displayName;
    this.countryCode = countryCode;
    this.settlementCurrency = settlementCurrency;
    this.currentStatus = props.status ?? "draft";
    this.createdAt = new Date(props.createdAt ?? new Date());
  }

  get status(): MerchantProfileStatus {
    return this.currentStatus;
  }

  get statusReason(): string | null {
    return this.currentReason;
  }

  submitForReview(): void {
    if (this.currentStatus !== "draft") {
      throw new Error("Only a draft merchant can be submitted for review");
    }
    this.currentStatus = "pending_review";
    this.currentReason = null;
  }

  approve(): void {
    if (this.currentStatus !== "pending_review") {
      throw new Error("Only a pending merchant can be approved");
    }
    this.currentStatus = "active";
    this.currentReason = null;
  }

  reject(reason: string): void {
    if (this.currentStatus !== "pending_review") {
      throw new Error("Only a pending merchant can be rejected");
    }
    this.currentStatus = "rejected";
    this.currentReason = this.requireReason(reason);
  }

  suspend(reason: string): void {
    if (this.currentStatus !== "active") {
      throw new Error("Only an active merchant can be suspended");
    }
    this.currentStatus = "suspended";
    this.currentReason = this.requireReason(reason);
  }

  reactivate(): void {
    if (this.currentStatus !== "suspended") {
      throw new Error("Only a suspended merchant can be reactivated");
    }
    this.currentStatus = "active";
    this.currentReason = null;
  }

  close(reason: string): void {
    if (["closed", "rejected"].includes(this.currentStatus)) {
      throw new Error("Merchant cannot be closed from its current status");
    }
    this.currentStatus = "closed";
    this.currentReason = this.requireReason(reason);
  }

  canAcceptPayments(): boolean {
    return this.currentStatus === "active";
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      legalName: this.legalName,
      displayName: this.displayName,
      countryCode: this.countryCode,
      settlementCurrency: this.settlementCurrency,
      status: this.currentStatus,
      statusReason: this.currentReason,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private requireReason(reason: string): string {
    const value = reason.trim();
    if (!value) throw new Error("Merchant status reason is required");
    return value;
  }
}
