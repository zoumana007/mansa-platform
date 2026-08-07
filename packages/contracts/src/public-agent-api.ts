import type { PageRequest, PageResponse } from './pagination.js';
import type { PublicAgent, PublicAgentStatus } from './public-services.js';

export const PUBLIC_AGENT_API_ROUTES = {
  listAgents: '/v1/public-services/agents',
  getAgent: '/v1/public-services/agents/:agentId',
  registerAgent: '/v1/public-services/agents',
  updateAgent: '/v1/public-services/agents/:agentId',
  suspendAgent: '/v1/public-services/agents/:agentId/suspension',
  reactivateAgent: '/v1/public-services/agents/:agentId/reactivation',
  revokeAgent: '/v1/public-services/agents/:agentId/revocation',
} as const;

export const PUBLIC_AGENT_API_METHODS = {
  listAgents: 'GET',
  getAgent: 'GET',
  registerAgent: 'POST',
  updateAgent: 'PATCH',
  suspendAgent: 'POST',
  reactivateAgent: 'POST',
  revokeAgent: 'POST',
} as const;

export type PublicAgentApiRouteName = keyof typeof PUBLIC_AGENT_API_ROUTES;

export interface ListPublicAgentsQuery extends PageRequest {
  organizationId?: string;
  userId?: string;
  employeeNumber?: string;
  unitCode?: string;
  jurisdictionCode?: string;
  status?: PublicAgentStatus;
}

export interface RegisterPublicAgentCommand {
  organizationId: string;
  userId: string;
  employeeNumber: string;
  unitCode?: string;
  roleCodes: readonly string[];
  jurisdictionCodes: readonly string[];
  allowedDeviceIds: readonly string[];
  validFrom: string;
  validUntil?: string;
}

export interface UpdatePublicAgentCommand {
  agentId: string;
  unitCode?: string;
  roleCodes?: readonly string[];
  jurisdictionCodes?: readonly string[];
  allowedDeviceIds?: readonly string[];
  validUntil?: string;
}

export interface ChangePublicAgentStatusCommand {
  agentId: string;
  reason: string;
  approvalRequestId?: string;
}

export interface PublicAgentApiContract {
  listAgents: {
    method: typeof PUBLIC_AGENT_API_METHODS.listAgents;
    path: typeof PUBLIC_AGENT_API_ROUTES.listAgents;
    request: ListPublicAgentsQuery;
    response: PageResponse<PublicAgent>;
  };
  getAgent: {
    method: typeof PUBLIC_AGENT_API_METHODS.getAgent;
    path: typeof PUBLIC_AGENT_API_ROUTES.getAgent;
    request: { agentId: string };
    response: PublicAgent;
  };
  registerAgent: {
    method: typeof PUBLIC_AGENT_API_METHODS.registerAgent;
    path: typeof PUBLIC_AGENT_API_ROUTES.registerAgent;
    request: RegisterPublicAgentCommand;
    response: PublicAgent;
  };
  updateAgent: {
    method: typeof PUBLIC_AGENT_API_METHODS.updateAgent;
    path: typeof PUBLIC_AGENT_API_ROUTES.updateAgent;
    request: UpdatePublicAgentCommand;
    response: PublicAgent;
  };
  suspendAgent: {
    method: typeof PUBLIC_AGENT_API_METHODS.suspendAgent;
    path: typeof PUBLIC_AGENT_API_ROUTES.suspendAgent;
    request: ChangePublicAgentStatusCommand;
    response: PublicAgent;
  };
  reactivateAgent: {
    method: typeof PUBLIC_AGENT_API_METHODS.reactivateAgent;
    path: typeof PUBLIC_AGENT_API_ROUTES.reactivateAgent;
    request: ChangePublicAgentStatusCommand;
    response: PublicAgent;
  };
  revokeAgent: {
    method: typeof PUBLIC_AGENT_API_METHODS.revokeAgent;
    path: typeof PUBLIC_AGENT_API_ROUTES.revokeAgent;
    request: ChangePublicAgentStatusCommand;
    response: PublicAgent;
  };
}
