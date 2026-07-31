import { randomUUID } from 'node:crypto';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';

const CORRELATION_HEADER = 'x-correlation-id';

interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  correlationId?: string;
}

interface HttpResponse {
  setHeader(name: string, value: string): void;
}

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequest>();
    const response = http.getResponse<HttpResponse>();
    const correlationId = resolveCorrelationId(request.headers[CORRELATION_HEADER]);

    request.correlationId = correlationId;
    response.setHeader(CORRELATION_HEADER, correlationId);

    return next.handle();
  }
}

export function resolveCorrelationId(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim();

  return normalized && normalized.length <= 128 ? normalized : randomUUID();
}
