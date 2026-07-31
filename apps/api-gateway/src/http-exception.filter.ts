import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface CorrelatedRequest {
  correlationId?: string;
  method?: string;
  url?: string;
}

interface JsonResponse {
  status(code: number): JsonResponse;
  json(body: unknown): void;
}

interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<CorrelatedRequest>();
    const response = http.getResponse<JsonResponse>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = normalizeException(exception, status);

    response.status(status).json({
      error,
      meta: {
        correlationId: request.correlationId ?? null,
        timestamp: new Date().toISOString(),
        path: request.url ?? null,
      },
    });
  }
}

export function normalizeException(
  exception: unknown,
  status: number,
): ErrorPayload {
  if (!(exception instanceof HttpException)) {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur interne est survenue.',
    };
  }

  const payload = exception.getResponse();

  if (typeof payload === 'string') {
    return {
      code: statusToCode(status),
      message: payload,
    };
  }

  if (isRecord(payload)) {
    const rawMessage = payload.message;
    const message = Array.isArray(rawMessage)
      ? 'La requête contient des données invalides.'
      : typeof rawMessage === 'string'
        ? rawMessage
        : exception.message;
    const code =
      typeof payload.code === 'string' && payload.code.trim()
        ? payload.code.trim()
        : statusToCode(status);

    return {
      code,
      message,
      ...(Array.isArray(rawMessage) ? { details: rawMessage } : {}),
    };
  }

  return {
    code: statusToCode(status),
    message: exception.message,
  };
}

function statusToCode(status: number): string {
  return HttpStatus[status] ?? `HTTP_${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
