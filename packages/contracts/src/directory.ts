export const DIRECTORY_PROFILE_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'] as const;
export type DirectoryProfileStatus = (typeof DIRECTORY_PROFILE_STATUSES)[number];

export const DIRECTORY_SUBSCRIPTION_TIERS = ['FREE', 'STANDARD', 'PREMIUM', 'ENTERPRISE'] as const;
export type DirectorySubscriptionTier = (typeof DIRECTORY_SUBSCRIPTION_TIERS)[number];

export const DIRECTORY_CONTACT_CHANNELS = ['PHONE', 'EMAIL', 'WHATSAPP', 'WEBSITE', 'IN_APP'] as const;
export type DirectoryContactChannel = (typeof DIRECTORY_CONTACT_CHANNELS)[number];

export interface DirectoryGeoPoint {
  latitude: number;
  longitude: number;
}

export interface DirectoryOpeningPeriod {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}

export interface DirectoryContact {
  channel: DirectoryContactChannel;
  label?: string;
  valueMasked?: string;
  publicValue?: string;
  isPrimary: boolean;
}

export interface DirectoryProfile {
  id: string;
  merchantId: string;
  locationId?: string;
  slug: string;
  displayName: string;
  shortDescription: string;
  description?: string;
  categoryIds: string[];
  tags: string[];
  countryCode: string;
  administrativeArea?: string;
  city?: string;
  address?: string;
  geoPoint?: DirectoryGeoPoint;
  contacts: DirectoryContact[];
  openingHours: DirectoryOpeningPeriod[];
  logoAssetId?: string;
  coverAssetId?: string;
  galleryAssetIds: string[];
  status: DirectoryProfileStatus;
  subscriptionTier: DirectorySubscriptionTier;
  isFeatured: boolean;
  featuredUntil?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDirectoryProfileCommand {
  merchantId: string;
  locationId?: string;
  slug: string;
  displayName: string;
  shortDescription: string;
  categoryIds: string[];
  countryCode: string;
  actorId: string;
  idempotencyKey: string;
}

export interface UpdateDirectoryProfileCommand {
  profileId: string;
  displayName?: string;
  shortDescription?: string;
  description?: string;
  categoryIds?: string[];
  tags?: string[];
  administrativeArea?: string;
  city?: string;
  address?: string;
  geoPoint?: DirectoryGeoPoint;
  contacts?: DirectoryContact[];
  openingHours?: DirectoryOpeningPeriod[];
  logoAssetId?: string;
  coverAssetId?: string;
  galleryAssetIds?: string[];
  actorId: string;
}

export interface ChangeDirectoryProfileStatusCommand {
  profileId: string;
  status: DirectoryProfileStatus;
  reason?: string;
  actorId: string;
  idempotencyKey: string;
}

export interface DirectorySearchQuery {
  text?: string;
  categoryIds?: string[];
  tags?: string[];
  countryCode?: string;
  administrativeArea?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  openAt?: string;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface DirectorySearchResult {
  profile: DirectoryProfile;
  distanceMeters?: number;
  relevanceScore?: number;
}

const DIRECTORY_STATUS_TRANSITIONS: Readonly<Record<DirectoryProfileStatus, readonly DirectoryProfileStatus[]>> = {
  DRAFT: ['PENDING_REVIEW', 'ARCHIVED'],
  PENDING_REVIEW: ['DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'],
  PUBLISHED: ['SUSPENDED', 'ARCHIVED'],
  SUSPENDED: ['PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  ARCHIVED: [],
};

export function isDirectoryProfileStatus(value: string): value is DirectoryProfileStatus {
  return DIRECTORY_PROFILE_STATUSES.includes(value as DirectoryProfileStatus);
}

export function isDirectorySubscriptionTier(value: string): value is DirectorySubscriptionTier {
  return DIRECTORY_SUBSCRIPTION_TIERS.includes(value as DirectorySubscriptionTier);
}

export function isDirectoryContactChannel(value: string): value is DirectoryContactChannel {
  return DIRECTORY_CONTACT_CHANNELS.includes(value as DirectoryContactChannel);
}

export function canTransitionDirectoryProfileStatus(
  from: DirectoryProfileStatus,
  to: DirectoryProfileStatus,
): boolean {
  return DIRECTORY_STATUS_TRANSITIONS[from].includes(to);
}

export function isValidDirectoryGeoPoint(point: DirectoryGeoPoint): boolean {
  return Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude)
    && point.latitude >= -90
    && point.latitude <= 90
    && point.longitude >= -180
    && point.longitude <= 180;
}
