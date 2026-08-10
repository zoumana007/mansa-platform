import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { WorkloadIdentity } from '@mansa/contracts/workload-identity';

import type { WorkloadIdentityVerifier } from './workload-identity.verifier.js';

interface WorkloadJwtPayload extends WorkloadIdentity {
  readonly iss?: string;
  readonly aud?: string;
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function parseJson<T>(encoded: string): T {
  return JSON.parse(decodeBase64Url(encoded).toString('utf8')) as T;
}

@Injectable()
export class HmacWorkloadIdentityVerifier implements WorkloadIdentityVerifier {
  public async verify(credential: string): Promise<WorkloadIdentity> {
    const secret = process.env.WORKLOAD_IDENTITY_HMAC_SECRET;
    const expectedIssuer = process.env.WORKLOAD_IDENTITY_ISSUER;
    const expectedAudience = process.env.WORKLOAD_IDENTITY_AUDIENCE;

    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('WORKLOAD_IDENTITY_HMAC_SECRET must contain at least 32 bytes');
    }
    if (!expectedIssuer || !expectedAudience) {
      throw new Error('WORKLOAD_IDENTITY_ISSUER and WORKLOAD_IDENTITY_AUDIENCE are required');
    }

    const parts = credential.split('.');
    if (parts.length !== 3) throw new Error('invalid workload JWT');
    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const header = parseJson<{ alg?: string; typ?: string }>(encodedHeader);
    if (header.alg !== 'HS256' || (header.typ !== undefined && header.typ !== 'JWT')) {
      throw new Error('unsupported workload JWT header');
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const actualSignature = decodeBase64Url(encodedSignature);
    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      throw new Error('invalid workload JWT signature');
    }

    const payload = parseJson<WorkloadJwtPayload>(encodedPayload);
    if (payload.iss !== expectedIssuer || payload.aud !== expectedAudience) {
      throw new Error('invalid workload JWT issuer or audience');
    }

    return {
      version: payload.version,
      workloadId: payload.workloadId,
      organizationId: payload.organizationId,
      scopes: payload.scopes,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      tokenId: payload.tokenId,
    };
  }
}
