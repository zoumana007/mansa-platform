import { Injectable } from '@nestjs/common';
import { processAccessRequest } from '@mansa/contracts/access-application-service';
import type { AccessDecision, AccessRequest } from '@mansa/contracts/access-mobility';

import { PrismaAccessRepository } from './access.repository';

@Injectable()
export class AccessService {
  public constructor(private readonly repository: PrismaAccessRepository) {}

  public async evaluate(request: AccessRequest): Promise<AccessDecision> {
    const replay = await this.repository.findRecordedDecision(request.organizationId, request.requestId);
    if (replay) return replay;

    const result = await processAccessRequest(request, {
      repository: this.repository,
      quota: this.repository,
      journal: this.repository,
    });
    return result.decision;
  }
}
