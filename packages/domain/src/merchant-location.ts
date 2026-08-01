export type MerchantLocationStatus = "draft" | "active" | "suspended" | "closed";

export interface MerchantLocationProps {
  id: string;
  merchantId: string;
  name: string;
  countryCode: string;
  city: string;
  addressLine: string;
  status?: MerchantLocationStatus;
  createdAt?: Date;
}

export class MerchantLocation {
  readonly id: string;
  readonly merchantId: string;
  readonly countryCode: string;
  readonly createdAt: Date;
  private currentName: string;
  private currentCity: string;
  private currentAddressLine: string;
  private currentStatus: MerchantLocationStatus;
  private currentStatusReason: string | null = null;

  constructor(props: MerchantLocationProps) {
    this.id = MerchantLocation.required(props.id, "Merchant location id");
    this.merchantId = MerchantLocation.required(props.merchantId, "Merchant id");
    this.currentName = MerchantLocation.required(props.name, "Merchant location name");
    this.countryCode = MerchantLocation.countryCode(props.countryCode);
    this.currentCity = MerchantLocation.required(props.city, "Merchant location city");
    this.currentAddressLine = MerchantLocation.required(props.addressLine, "Merchant location address");
    this.currentStatus = props.status ?? "draft";
    this.createdAt = new Date(props.createdAt ?? new Date());
  }

  get name(): string { return this.currentName; }
  get city(): string { return this.currentCity; }
  get addressLine(): string { return this.currentAddressLine; }
  get status(): MerchantLocationStatus { return this.currentStatus; }
  get statusReason(): string | null { return this.currentStatusReason; }

  activate(): void {
    if (this.currentStatus !== "draft" && this.currentStatus !== "suspended") {
      throw new Error("Only a draft or suspended merchant location can be activated");
    }
    this.currentStatus = "active";
    this.currentStatusReason = null;
  }

  updateDetails(details: { name?: string; city?: string; addressLine?: string }): void {
    if (this.currentStatus === "closed") throw new Error("A closed merchant location cannot be updated");
    if (details.name !== undefined) this.currentName = MerchantLocation.required(details.name, "Merchant location name");
    if (details.city !== undefined) this.currentCity = MerchantLocation.required(details.city, "Merchant location city");
    if (details.addressLine !== undefined) this.currentAddressLine = MerchantLocation.required(details.addressLine, "Merchant location address");
  }

  suspend(reason: string): void {
    if (this.currentStatus !== "active") throw new Error("Only an active merchant location can be suspended");
    this.currentStatus = "suspended";
    this.currentStatusReason = MerchantLocation.required(reason, "Merchant location status reason");
  }

  close(reason: string): void {
    if (this.currentStatus === "closed") throw new Error("Merchant location is already closed");
    this.currentStatus = "closed";
    this.currentStatusReason = MerchantLocation.required(reason, "Merchant location status reason");
  }

  canOperate(): boolean {
    return this.currentStatus === "active";
  }

  toJSON() {
    return {
      id: this.id,
      merchantId: this.merchantId,
      name: this.currentName,
      countryCode: this.countryCode,
      city: this.currentCity,
      addressLine: this.currentAddressLine,
      status: this.currentStatus,
      statusReason: this.currentStatusReason,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private static required(value: string, label: string): string {
    const normalized = value.trim();
    if (!normalized) throw new Error(`${label} is required`);
    return normalized;
  }

  private static countryCode(value: string): string {
    const normalized = value.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("Country code must use ISO 3166-1 alpha-2 format");
    return normalized;
  }
}
