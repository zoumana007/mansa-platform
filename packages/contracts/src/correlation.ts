const IDENTIFIER_PATTERN = /^(req|cor|cau|trc)_[A-Za-z0-9_-]{8,128}$/;

export type RequestId = string & { readonly __brand: 'RequestId' };
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };
export type CausationId = string & { readonly __brand: 'CausationId' };
export type TraceId = string & { readonly __brand: 'TraceId' };

export interface RequestContext {
  requestId: RequestId;
  correlationId: CorrelationId;
  causationId?: CausationId;
  traceId?: TraceId;
}

function hasPrefix(value: string, prefix: string): boolean {
  return value.startsWith(`${prefix}_`) && IDENTIFIER_PATTERN.test(value);
}

export function isRequestId(value: string): value is RequestId {
  return hasPrefix(value, 'req');
}

export function isCorrelationId(value: string): value is CorrelationId {
  return hasPrefix(value, 'cor');
}

export function isCausationId(value: string): value is CausationId {
  return hasPrefix(value, 'cau');
}

export function isTraceId(value: string): value is TraceId {
  return hasPrefix(value, 'trc');
}

export function parseRequestId(value: string): RequestId {
  if (!isRequestId(value)) {
    throw new TypeError('Invalid request identifier');
  }
  return value;
}

export function parseCorrelationId(value: string): CorrelationId {
  if (!isCorrelationId(value)) {
    throw new TypeError('Invalid correlation identifier');
  }
  return value;
}

export function parseCausationId(value: string): CausationId {
  if (!isCausationId(value)) {
    throw new TypeError('Invalid causation identifier');
  }
  return value;
}

export function parseTraceId(value: string): TraceId {
  if (!isTraceId(value)) {
    throw new TypeError('Invalid trace identifier');
  }
  return value;
}
