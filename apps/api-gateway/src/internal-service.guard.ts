import { timingSafeEqual } from 'node:crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

const HEADER_NAME = 'x-mansa-internal-token';

type InternalRequest = {
  readonly headers: Record<string, string | readonly string[] | undefined>;
};

const safeEquals = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

/**
 * Transitional service-to-service protection for internal-only routes.
 *
 * Production deployments must source INTERNAL_SERVICE_TOKEN from a secret manager.
 * This guard is intentionally fail-closed when the token is absent. It can later
 * be replaced by mTLS or signed workload identity without changing controllers.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (expected === undefined || expected.trim().length < 32) {
      throw new ServiceUnavailableException('Internal service authentication is not configured.');
    }

    const request = context.switchToHttp().getRequest<InternalRequest>();
    const rawHeader = request.headers[HEADER_NAME];
    const received = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (typeof received !== 'string' || !safeEquals(received, expected)) {
      throw new UnauthorizedException('Unauthorized internal service request.');
    }

    return true;
  }
}
