export type PaymentCardStatus =
  | "pending"
  | "active"
  | "frozen"
  | "blocked"
  | "expired"
  | "terminated";

export type PaymentCardType = "physical" | "virtual" | "disposable";

export interface PaymentCardProps {
  id: string;
  ownerId: string;
  type: PaymentCardType;
  last4: string;
  expiresAt: Date;
  createdAt?: Date;
  status?: PaymentCardStatus;
}

export class PaymentCard {
  readonly id: string;
  readonly ownerId: string;
  readonly type: PaymentCardType;
  readonly last4: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  private currentStatus: PaymentCardStatus;

  constructor(props: PaymentCardProps) {
    const id = props.id.trim();
    const ownerId = props.ownerId.trim();
    const last4 = props.last4.trim();
    const createdAt = props.createdAt ?? new Date();

    if (!id) throw new Error("Payment card id is required");
    if (!ownerId) throw new Error("Payment card owner id is required");
    if (!/^\d{4}$/.test(last4)) {
      throw new Error("Payment card last4 must contain exactly four digits");
    }
    if (props.expiresAt.getTime() <= createdAt.getTime()) {
      throw new Error("Payment card expiration must be after creation");
    }

    this.id = id;
    this.ownerId = ownerId;
    this.type = props.type;
    this.last4 = last4;
    this.expiresAt = new Date(props.expiresAt);
    this.createdAt = new Date(createdAt);
    this.currentStatus = props.status ?? "pending";
  }

  get status(): PaymentCardStatus {
    return this.currentStatus;
  }

  activate(at = new Date()): void {
    if (this.currentStatus !== "pending") {
      throw new Error("Only a pending payment card can be activated");
    }
    if (at.getTime() >= this.expiresAt.getTime()) {
      throw new Error("An expired payment card cannot be activated");
    }
    this.currentStatus = "active";
  }

  freeze(): void {
    if (this.currentStatus !== "active") {
      throw new Error("Only an active payment card can be frozen");
    }
    this.currentStatus = "frozen";
  }

  unfreeze(at = new Date()): void {
    if (this.currentStatus !== "frozen") {
      throw new Error("Only a frozen payment card can be unfrozen");
    }
    if (at.getTime() >= this.expiresAt.getTime()) {
      throw new Error("An expired payment card cannot be unfrozen");
    }
    this.currentStatus = "active";
  }

  block(): void {
    if (["blocked", "expired", "terminated"].includes(this.currentStatus)) {
      throw new Error("Payment card cannot be blocked from its current status");
    }
    this.currentStatus = "blocked";
  }

  expire(at = new Date()): void {
    if (["expired", "terminated"].includes(this.currentStatus)) {
      throw new Error("Payment card cannot expire from its current status");
    }
    if (at.getTime() < this.expiresAt.getTime()) {
      throw new Error("Payment card cannot expire before its deadline");
    }
    this.currentStatus = "expired";
  }

  terminate(): void {
    if (this.currentStatus === "terminated") {
      throw new Error("Payment card is already terminated");
    }
    this.currentStatus = "terminated";
  }

  canAuthorize(at = new Date()): boolean {
    return this.currentStatus === "active" && at.getTime() < this.expiresAt.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      type: this.type,
      last4: this.last4,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.currentStatus,
    };
  }
}
