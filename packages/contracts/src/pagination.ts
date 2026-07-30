export interface PageRequest {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface PageInfo {
  readonly nextCursor?: string;
  readonly hasNextPage: boolean;
}

export interface PageResponse<T> {
  readonly data: readonly T[];
  readonly page: PageInfo;
}

export function normalizePageLimit(
  limit: number | undefined,
  options: { readonly defaultLimit?: number; readonly maxLimit?: number } = {},
): number {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const value = limit ?? defaultLimit;

  if (!Number.isInteger(value) || value < 1 || value > maxLimit) {
    throw new RangeError(`limit must be an integer between 1 and ${maxLimit}`);
  }

  return value;
}
