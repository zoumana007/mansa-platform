export type MerchantStaffRole = "owner" | "manager" | "cashier" | "support";
export type MerchantStaffStatus = "invited" | "active" | "suspended" | "revoked";

export interface MerchantStaffMemberProps {
  id: string;
  merchantId: string;
  userId: string;
  role: MerchantStaffRole;
  status?: MerchantStaffStatus;
  createdAt?: Date;
}

const permissionsByRole: Record<MerchantStaffRole, readonly string[]> = {
  owner: ["merchant.manage", "staff.manage", "payments.accept", "refunds.create", "reports.read"],
  manager: ["staff.read", "payments.accept", "refunds.create", "reports.read"],
  cashier: ["payments.accept", "transactions.read"],
  support: ["transactions.read", "customers.assist"],
};

export class MerchantStaffMember {
  readonly id: string;
  readonly merchantId: string;
  readonly userId: string;
  readonly createdAt: Date;
  private currentRole: MerchantStaffRole;
  private currentStatus: MerchantStaffStatus;
  private currentReason: string | null = null;

  constructor(props: MerchantStaffMemberProps) {
    this.id = MerchantStaffMember.required(props.id, "Merchant staff id");
    this.merchantId = MerchantStaffMember.required(props.merchantId, "Merchant id");
    this.userId = MerchantStaffMember.required(props.userId, "Merchant staff user id");
    this.currentRole = props.role;
    this.currentStatus = props.status ?? "invited";
    this.createdAt = new Date(props.createdAt ?? new Date());
  }

  get role(): MerchantStaffRole {
    return this.currentRole;
  }

  get status(): MerchantStaffStatus {
    return this.currentStatus;
  }

  get statusReason(): string | null {
    return this.currentReason;
  }

  activate(): void {
    if (this.currentStatus !== "invited") throw new Error("Only an invited staff member can be activated");
    this.currentStatus = "active";
  }

  changeRole(role: MerchantStaffRole): void {
    if (this.currentStatus === "revoked") throw new Error("A revoked staff member cannot change role");
    this.currentRole = role;
  }

  suspend(reason: string): void {
    if (this.currentStatus !== "active") throw new Error("Only an active staff member can be suspended");
    this.currentStatus = "suspended";
    this.currentReason = MerchantStaffMember.required(reason, "Merchant staff status reason");
  }

  reactivate(): void {
    if (this.currentStatus !== "suspended") throw new Error("Only a suspended staff member can be reactivated");
    this.currentStatus = "active";
    this.currentReason = null;
  }

  revoke(reason: string): void {
    if (this.currentStatus === "revoked") throw new Error("Merchant staff member is already revoked");
    this.currentStatus = "revoked";
    this.currentReason = MerchantStaffMember.required(reason, "Merchant staff status reason");
  }

  can(permission: string): boolean {
    return this.currentStatus === "active" && permissionsByRole[this.currentRole].includes(permission.trim());
  }

  toJSON() {
    return {
      id: this.id,
      merchantId: this.merchantId,
      userId: this.userId,
      role: this.currentRole,
      status: this.currentStatus,
      statusReason: this.currentReason,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private static required(value: string, label: string): string {
    const normalized = value.trim();
    if (!normalized) throw new Error(`${label} is required`);
    return normalized;
  }
}
