import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

type StoredRecord = {
  requestFingerprint: string;
  status: string;
  response: Prisma.JsonValue | null;
};

type ExecuteOptions<T> = {
  scope: string;
  organizationId: string;
  idempotencyKey: string;
  correlationId: string;
  payload: unknown;
  operation: () => Promise<T>;
  recover?: () => Promise<T | undefined>;
};

function required(name: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function fingerprint(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

@Injectable()
export class OperationIdempotencyRegistry {
  public constructor(private readonly prisma: PrismaService) {}

  private async find(scope: string, organizationId: string, idempotencyKey: string): Promise<StoredRecord | undefined> {
    const rows = await this.prisma.$queryRaw<StoredRecord[]>(Prisma.sql`
      SELECT "requestFingerprint", "status", "response"
      FROM "OperationIdempotencyRecord"
      WHERE "scope" = ${scope}
        AND "organizationId" = ${organizationId}
        AND "idempotencyKey" = ${idempotencyKey}
      LIMIT 1
    `);
    return rows[0];
  }

  private async complete(
    scope: string,
    organizationId: string,
    idempotencyKey: string,
    response: unknown,
  ): Promise<void> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "OperationIdempotencyRecord"
      SET "status" = 'COMPLETED',
          "response" = ${JSON.stringify(response)}::jsonb,
          "completedAt" = CURRENT_TIMESTAMP
      WHERE "scope" = ${scope}
        AND "organizationId" = ${organizationId}
        AND "idempotencyKey" = ${idempotencyKey}
    `);
  }

  public async execute<T>(options: ExecuteOptions<T>): Promise<T> {
    const scope = required('scope', options.scope);
    const organizationId = required('organizationId', options.organizationId);
    const idempotencyKey = required('idempotencyKey', options.idempotencyKey);
    const correlationId = required('correlationId', options.correlationId);
    const requestFingerprint = fingerprint(options.payload);

    const existing = await this.find(scope, organizationId, idempotencyKey);
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        throw new Error('idempotency key already used with a different payload');
      }
      if (existing.status === 'COMPLETED' && existing.response !== null) {
        return existing.response as unknown as T;
      }
      if (options.recover) {
        const recovered = await options.recover();
        if (recovered !== undefined) {
          await this.complete(scope, organizationId, idempotencyKey, recovered);
          return recovered;
        }
      }
      throw new Error('idempotent operation is already processing');
    }

    const inserted = await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "OperationIdempotencyRecord" (
        "scope", "organizationId", "idempotencyKey", "requestFingerprint", "status", "correlationId"
      ) VALUES (
        ${scope}, ${organizationId}, ${idempotencyKey}, ${requestFingerprint}, 'PROCESSING', ${correlationId}
      )
      ON CONFLICT ("scope", "organizationId", "idempotencyKey") DO NOTHING
    `);

    if (inserted === 0) {
      return this.execute(options);
    }

    try {
      const response = await options.operation();
      await this.complete(scope, organizationId, idempotencyKey, response);
      return response;
    } catch (error) {
      await this.prisma.$executeRaw(Prisma.sql`
        DELETE FROM "OperationIdempotencyRecord"
        WHERE "scope" = ${scope}
          AND "organizationId" = ${organizationId}
          AND "idempotencyKey" = ${idempotencyKey}
          AND "status" = 'PROCESSING'
      `);
      throw error;
    }
  }
}
