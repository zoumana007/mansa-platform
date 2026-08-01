export type SavingsGoalStatus = "active" | "paused" | "completed" | "cancelled";

export interface SavingsGoalProps {
  id: string;
  ownerId: string;
  name: string;
  currency: string;
  targetMinor: bigint;
  currentMinor?: bigint;
  targetDate?: Date;
  createdAt?: Date;
  status?: SavingsGoalStatus;
}

export class SavingsGoal {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly currency: string;
  readonly targetMinor: bigint;
  readonly targetDate?: Date;
  readonly createdAt: Date;
  private savedMinor: bigint;
  private currentStatus: SavingsGoalStatus;

  constructor(props: SavingsGoalProps) {
    const id = props.id.trim();
    const ownerId = props.ownerId.trim();
    const name = props.name.trim();
    const currency = props.currency.trim().toUpperCase();
    const currentMinor = props.currentMinor ?? 0n;

    if (!id) throw new Error("Savings goal id is required");
    if (!ownerId) throw new Error("Savings goal owner id is required");
    if (!name) throw new Error("Savings goal name is required");
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Savings goal currency must be an ISO 4217 code");
    }
    if (props.targetMinor <= 0n) {
      throw new Error("Savings goal target must be positive");
    }
    if (currentMinor < 0n || currentMinor > props.targetMinor) {
      throw new Error("Savings goal current amount is invalid");
    }

    this.id = id;
    this.ownerId = ownerId;
    this.name = name;
    this.currency = currency;
    this.targetMinor = props.targetMinor;
    this.savedMinor = currentMinor;
    this.createdAt = new Date(props.createdAt ?? new Date());
    this.targetDate = props.targetDate ? new Date(props.targetDate) : undefined;
    this.currentStatus = props.status ?? (currentMinor === props.targetMinor ? "completed" : "active");

    if (this.targetDate && this.targetDate.getTime() <= this.createdAt.getTime()) {
      throw new Error("Savings goal target date must be after creation");
    }
    if (this.currentStatus === "completed" && this.savedMinor !== this.targetMinor) {
      throw new Error("A completed savings goal must reach its target");
    }
  }

  get status(): SavingsGoalStatus {
    return this.currentStatus;
  }

  get currentMinor(): bigint {
    return this.savedMinor;
  }

  get remainingMinor(): bigint {
    return this.targetMinor - this.savedMinor;
  }

  contribute(amountMinor: bigint): void {
    if (this.currentStatus !== "active") {
      throw new Error("Only an active savings goal can receive contributions");
    }
    if (amountMinor <= 0n) {
      throw new Error("Savings goal contribution must be positive");
    }
    if (this.savedMinor + amountMinor > this.targetMinor) {
      throw new Error("Savings goal contribution exceeds target");
    }

    this.savedMinor += amountMinor;
    if (this.savedMinor === this.targetMinor) this.currentStatus = "completed";
  }

  withdraw(amountMinor: bigint): void {
    if (!["active", "paused"].includes(this.currentStatus)) {
      throw new Error("Savings goal cannot be withdrawn from its current status");
    }
    if (amountMinor <= 0n || amountMinor > this.savedMinor) {
      throw new Error("Savings goal withdrawal amount is invalid");
    }
    this.savedMinor -= amountMinor;
  }

  pause(): void {
    if (this.currentStatus !== "active") {
      throw new Error("Only an active savings goal can be paused");
    }
    this.currentStatus = "paused";
  }

  resume(): void {
    if (this.currentStatus !== "paused") {
      throw new Error("Only a paused savings goal can be resumed");
    }
    this.currentStatus = "active";
  }

  cancel(): void {
    if (["completed", "cancelled"].includes(this.currentStatus)) {
      throw new Error("Savings goal cannot be cancelled from its current status");
    }
    this.currentStatus = "cancelled";
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      name: this.name,
      currency: this.currency,
      targetMinor: this.targetMinor.toString(),
      currentMinor: this.savedMinor.toString(),
      remainingMinor: this.remainingMinor.toString(),
      targetDate: this.targetDate?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
      status: this.currentStatus,
    };
  }
}
