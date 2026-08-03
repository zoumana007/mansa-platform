import type { ApiErrorCode, ApiErrorDetails } from './api-error.js';

export interface ApiResponseMeta {
  readonly requestId: string;
  readonly timestamp: string;
}

export interface ApiSuccessResponse<TData> {
  readonly data: TData;
  readonly meta: ApiResponseMeta;
}

export interface ApiPageMeta extends ApiResponseMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasNextPage: boolean;
}

export interface ApiPageResponse<TData> {
  readonly data: readonly TData[];
  readonly meta: ApiPageMeta;
}

export interface ApiErrorBody {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly details?: readonly ApiErrorDetails[];
  readonly retryable: boolean;
}

export interface ApiErrorEnvelope {
  readonly error: ApiErrorBody;
  readonly meta: ApiResponseMeta;
}

export function createApiSuccessResponse<TData>(
  data: TData,
  meta: ApiResponseMeta,
): ApiSuccessResponse<TData> {
  return { data, meta };
}

export function createApiErrorEnvelope(
  error: ApiErrorBody,
  meta: ApiResponseMeta,
): ApiErrorEnvelope {
  return { error, meta };
}
