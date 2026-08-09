import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service';

export type OperationalAuditActorType = 'SERVICE_ACCOUNT' | 'SYSTEM' | 'USER';

export interface OperationalAuditRecordInput {
  readonly correlationId: string;
  readonly actorId: string;
  readonly actorType: OperationalAuditActorType;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly reason?: string;
  readonly metadata?: Prisma.InputJsonValue;
}

export interface DeadLetterRequeueAuditInput {
  readonly eventId: string;
  readonly maxAttempts: number;
  readonly now?: Date;
  readonly audit: OperationalAuditRecordInput;
}

const requireValue = (value: string, field: string, maxLength = 256): string => {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new Error(`${field} must contain between 1 and ${maxLength} characters.`);
  }
  return normalized;
};

const normalizeAuditData = (input: OperationalAuditRecordInput) => ({
  correlationId: requireValue(input.correlationId, 'correlationId', 128),
  actorId: requireValue(input.actorId, 'actorId'),
  actorType: input.actorType,
  action: requireValue(input.action, 'action'),
  resourceType: requireValue(input.resourceType, 'resourceType'),
  ...(input.resourceId === undefined
    ? {}
    : { resourceId: requireValue(input.resourceId, 'resourceId') }),
  ...(input.reason === undefined
    ? {}
    : { reason: requireValue(input.reason, 'reason', 1000) }),
  ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
});

@Injectable()
export class OperationalAuditService {
  public constructor(private readonly prisma: PrismaService) {}

  public async record(input: OperationalAuditRecordInput): Promise<void> {
    await this.prisma.operationalAuditLog.create({ data: normalizeAuditData(input) });
  }

  public async requeueDeadLetterWithAudit(input: DeadLetterRequeueAuditInput): Promise<boolean> {
    const now = input.now ?? new Date();
    const auditData = normalizeAuditData(input.audit);

    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.outboxEvent.updateMany({
        where: {
          id: input.eventId,
          status: 'FAILED',
          attempts: { gte: input.maxAttempts },
        },
        data: {
          status: 'PENDING',
          attempts: 0,
          availableAt: now,
          publishedAt: null,
          lastError: null,
        },
      });

      if (result.count !== 1) {
        return false;
      }

      await transaction.operationalAuditLog.create({ data: auditData });
      return true;
    });
  }
}
