import type { PageRequest, PageResponse } from './pagination.js';
import type {
  ActivateTerminalCommand,
  PaymentTerminal,
  RegisterTerminalCommand,
  TerminalEnvironment,
  TerminalHealthReport,
  TerminalSaleCommand,
  TerminalStatus,
  UpdateTerminalConfigurationCommand,
} from './terminal.js';
import type { Payment } from './payment.js';

export const TERMINAL_API_ROUTES = {
  registerTerminal: '/v1/terminals',
  listTerminals: '/v1/terminals',
  getTerminal: '/v1/terminals/:terminalId',
  activateTerminal: '/v1/terminals/activate',
  updateTerminalConfiguration: '/v1/terminals/:terminalId/configuration',
  submitHealthReport: '/v1/terminals/:terminalId/health',
  createTerminalSale: '/v1/terminals/:terminalId/sales',
} as const;

export const TERMINAL_API_METHODS = {
  registerTerminal: 'POST',
  listTerminals: 'GET',
  getTerminal: 'GET',
  activateTerminal: 'POST',
  updateTerminalConfiguration: 'PUT',
  submitHealthReport: 'POST',
  createTerminalSale: 'POST',
} as const;

export type TerminalApiRouteName = keyof typeof TERMINAL_API_ROUTES;

export interface ListTerminalsQuery extends PageRequest {
  merchantId?: string;
  locationId?: string;
  environment?: TerminalEnvironment;
  status?: TerminalStatus;
}

export interface TerminalApiContract {
  registerTerminal: {
    method: typeof TERMINAL_API_METHODS.registerTerminal;
    path: typeof TERMINAL_API_ROUTES.registerTerminal;
    request: RegisterTerminalCommand;
    response: PaymentTerminal;
  };
  listTerminals: {
    method: typeof TERMINAL_API_METHODS.listTerminals;
    path: typeof TERMINAL_API_ROUTES.listTerminals;
    request: ListTerminalsQuery;
    response: PageResponse<PaymentTerminal>;
  };
  getTerminal: {
    method: typeof TERMINAL_API_METHODS.getTerminal;
    path: typeof TERMINAL_API_ROUTES.getTerminal;
    request: { terminalId: string };
    response: PaymentTerminal;
  };
  activateTerminal: {
    method: typeof TERMINAL_API_METHODS.activateTerminal;
    path: typeof TERMINAL_API_ROUTES.activateTerminal;
    request: ActivateTerminalCommand;
    response: PaymentTerminal;
  };
  updateTerminalConfiguration: {
    method: typeof TERMINAL_API_METHODS.updateTerminalConfiguration;
    path: typeof TERMINAL_API_ROUTES.updateTerminalConfiguration;
    request: UpdateTerminalConfigurationCommand;
    response: PaymentTerminal;
  };
  submitHealthReport: {
    method: typeof TERMINAL_API_METHODS.submitHealthReport;
    path: typeof TERMINAL_API_ROUTES.submitHealthReport;
    request: TerminalHealthReport;
    response: { accepted: true; receivedAt: string };
  };
  createTerminalSale: {
    method: typeof TERMINAL_API_METHODS.createTerminalSale;
    path: typeof TERMINAL_API_ROUTES.createTerminalSale;
    request: TerminalSaleCommand;
    response: Payment;
  };
}
