import type {
  ConfirmVoiceIntentCommand,
  CreateVoiceCallCommand,
  VoiceCall,
  VoiceDataExport,
  VoiceIntent,
  VoiceRetentionConfiguration,
} from './voice.js';

export const VOICE_API_ROUTES = {
  createCall: '/v1/voice/calls',
  getCall: '/v1/voice/calls/:callId',
  listCallIntents: '/v1/voice/calls/:callId/intents',
  confirmIntent: '/v1/voice/calls/:callId/intents/:intentId/confirm',
  getRetentionConfiguration: '/v1/voice/retention',
  updateRetentionConfiguration: '/v1/voice/retention',
  requestDataExport: '/v1/voice/exports',
  getDataExport: '/v1/voice/exports/:exportId',
} as const;

export const VOICE_API_METHODS = {
  createCall: 'POST',
  getCall: 'GET',
  listCallIntents: 'GET',
  confirmIntent: 'POST',
  getRetentionConfiguration: 'GET',
  updateRetentionConfiguration: 'PUT',
  requestDataExport: 'POST',
  getDataExport: 'GET',
} as const;

export type VoiceApiRouteName = keyof typeof VOICE_API_ROUTES;

export interface ListVoiceCallIntentsQuery {
  readonly callId: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface RequestVoiceDataExportCommand {
  readonly organizationId: string;
  readonly requestedByActorId: string;
  readonly includeTranscripts: boolean;
  readonly includeRecordings: boolean;
  readonly includeStructuredBusinessData: boolean;
  readonly idempotencyKey: string;
}

export interface UpdateVoiceRetentionConfigurationCommand
  extends VoiceRetentionConfiguration {
  readonly updatedByActorId: string;
  readonly reason: string;
}

export interface VoiceApiContract {
  readonly createCall: {
    readonly request: CreateVoiceCallCommand;
    readonly response: VoiceCall;
  };
  readonly getCall: {
    readonly response: VoiceCall;
  };
  readonly listCallIntents: {
    readonly query: ListVoiceCallIntentsQuery;
    readonly response: readonly VoiceIntent[];
  };
  readonly confirmIntent: {
    readonly request: ConfirmVoiceIntentCommand;
    readonly response: VoiceIntent;
  };
  readonly getRetentionConfiguration: {
    readonly response: VoiceRetentionConfiguration;
  };
  readonly updateRetentionConfiguration: {
    readonly request: UpdateVoiceRetentionConfigurationCommand;
    readonly response: VoiceRetentionConfiguration;
  };
  readonly requestDataExport: {
    readonly request: RequestVoiceDataExportCommand;
    readonly response: VoiceDataExport;
  };
  readonly getDataExport: {
    readonly response: VoiceDataExport;
  };
}
