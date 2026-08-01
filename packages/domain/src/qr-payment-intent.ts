import { Money } from "./money.js";

export type QrPaymentIntentStatus =
  | "active"
  | "consumed"
  | "expired"
  | "cancelled";

export interface QrPaymentIntentProps {
  id: string;
  merchantId: string;
  amount: Money | null;
  reference: string | null;
  expiresAt: Date;
  createdAt?: Date;
  status?: QrPaymentIntentStatus;
}

export class QrPaymentIntent {
  readonly id: string;
  readonly merchantId: string;
  readonly amount: Money | null;
  readonly reference: string | null;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  private currentStatus: QrPaymentIntentStatus;

  constructor(props: QrPaymentIntentProps) {
    const id = props.id.trim();
    const merchantId = props.merchantId.trim();
    const reference = props.reference?.trim() || null;
    const createdAt = props.createdAt ?? new Date();

    if (!id) {
      throw new Error("QR payment intent id is required");
    }

    if (!merchantId) {
      throw new Error("QR payment intent merchant id is required");
    }

    if (props.amount && !props.amount.isPositive()) {
      throw new Error("QR payment intent amount must be positive");
    }

    if (props.expiresAt.getTime() <= createdAt.getTime()) {
      throw new Error("QR payment intent expiration must be after creation");
    }

    this.id = id;
    this.merchantId = merchantId;
    this.amount = props.amount;
    this.reference = reference;
    this.expiresAt = new Date(props.expiresAt);
    this.createdAt = new Date(createdAt);
    this.currentStatus = props.status ?? "active";
  }

  get status(): QrPaymentIntentStatus {
    return this.currentStatus;
  }

  isPayable(at = new Date()): boolean {
    return this.currentStatus === "active" && at.getTime() < this.expiresAt.getTime();
  }

  expire(at = new Date()): void {
    if (this.currentStatus !== "active") {
      throw new Error("Only an active QR payment intent can expire");
    }

    if (at.getTime() < this.expiresAt.getTime()) {
      throw new Error("QR payment intent cannot expire before its deadline");
    }

    this.currentStatus = "expired";
  }

  consume(at = new Date()): void {
    if (!this.isPayable(at)) {
      throw new Error("QR payment intent is not payable");
    }

    this.currentStatus = "consumed";
  }

  cancel(): void {
    if (this.currentStatus !== "active") {
      throw new Error("Only an active QR payment intent can be cancelled");
    }

    this.currentStatus = "cancelled";
  }

  toJSON() {
    return {
      id: this.id,
      merchantId: this.merchantId,
      amount: this.amount?.toJSON() ?? null,
      reference: this.reference,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.currentStatus,
    };
  }
}
