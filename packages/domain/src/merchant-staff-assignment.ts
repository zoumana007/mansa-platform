export type MerchantStaffAssignmentStatus = "active" | "suspended" | "revoked";

export interface MerchantStaffAssignmentProps {
  id: string;
  merchantId: string;
  staffMemberId: string;
  locationId: string;
  permissions?: readonly string[];
  maxTransactionAmountMinor?: bigint | null;
  status?: MerchantStaffAssignmentStatus;
  createdAt?: Date;
}

export class MerchantStaffAssignment {
  readonly id: string;
  readonly merchantId: string;
  readonly staffMemberId: string;
  readonly locationId: string;
  readonly createdAt: Date;
  private currentPermissions: Set<string>;
  private currentMaxTransactionAmountMinor: bigint | null;
  private currentStatus: MerchantStaffAssignmentStatus;
  private currentReason: string | null = null;

  constructor(props: MerchantStaffAssignmentProps) {
    this.id = MerchantStaffAssignment.required(props.id, "Merchant staff assignment id");
    this.merchantId = MerchantStaffAssignment.required(props.merchantId, "Merchant id");
    this.staffMemberId = MerchantStaffAssignment.required(props.staffMemberId, "Merchant staff member id");
    this.locationId = MerchantStaffAssignment.required(props.locationId, "Merchant location id");
    this.currentPermissions = new Set((props.permissions ?? []).map(MerchantStaffAssignment.normalizePermission));
    this.currentMaxTransactionAmountMinor = MerchantStaffAssignment.validateLimit(
      props.maxTransactionAmountMinor ?? null,
    );
    this.currentStatus = props.status ?? "active";
    this.createdAt = new Date(props.createdAt ?? new Date());
  }

  get status(): MerchantStaffAssignmentStatus {
    return this.currentStatus;
  }

  get statusReason(): string | null {
    return this.currentReason;
  }

  get permissions(): readonly string[] {
    return [...this.currentPermissions].sort();
  }

  get maxTransactionAmountMinor(): bigint | null {
    return this.currentMaxTransactionAmountMinor;
  }

  replacePermissions(permissions: readonly string[]): void {
    this.ensureMutable();
    this.currentPermissions = new Set(permissions.map(MerchantStaffAssignment.normalizePermission));
  }

  setTransactionLimit(amountMinor: bigint | null): void {
    this.ensureMutable();
    this.currentMaxTransactionAmountMinor = MerchantStaffAssignment.validateLimit(amountMinor);
  }

  suspend(reason: string): void {
    if (this.currentStatus !== "active") throw new Error("Only an active assignment can be suspended");
    this.currentStatus = "suspended";
    this.currentReason = MerchantStaffAssignment.required(reason, "Merchant staff assignment reason");
  }

  reactivate(): void {
    if (this.currentStatus !== "suspended") throw new Error("Only a suspended assignment can be reactivated");
    this.currentStatus = "active";
    this.currentReason = null;
  }

  revoke(reason: string): void {
    if (this.currentStatus === "revoked") throw new Error("Merchant staff assignment is already revoked");
    this.currentStatus = "revoked";
    this.currentReason = MerchantStaffAssignment.required(reason, "Merchant staff assignment reason");
  }

  allows(permission: string, amountMinor?: bigint): boolean {
    if (this.currentStatus !== "active") return false;
    const normalizedPermission = MerchantStaffAssignment.normalizePermission(permission);
    if (!this.currentPermissions.has(normalizedPermission)) return false;
    if (amountMinor === undefined || this.currentMaxTransactionAmountMinor === null) return true;
    if (amountMinor < 0n) return false;
    return amountMinor <= this.currentMaxTransactionAmountMinor;
  }

  toJSON() {
    return {
      id: this.id,
      merchantId: this.merchantId,
      staffMemberId: this.staffMemberId,
      locationId: this.locationId,
      permissions: this.permissions,
      maxTransactionAmountMinor:
        this.currentMaxTransactionAmountMinor === null ? null : this.currentMaxTransactionAmountMinor.toString(),
      status: this.currentStatus,
      statusReason: this.currentReason,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private ensureMutable(): void {
    if (this.currentStatus === "revoked") throw new Error("A revoked assignment cannot be modified");
  }

  private static normalizePermission(permission: string): string {
    return MerchantStaffAssignment.required(permission, "Merchant staff assignment permission").toLowerCase();
  }

  private static validateLimit(amountMinor: bigint | null): bigint | null {
    if (amountMinor !== null && amountMinor < 0n) {
      throw new Error("Merchant staff assignment transaction limit cannot be negative");
    }
    return amountMinor;
  }

  private static required(value: string, label: string): string {
    const normalized = value.trim();
    if (!normalized) throw new Error(`${label} is required`);
    return normalized;
  }
}
