import type {
  CreateKycDraftCommand,
  KycCase,
  KycCaseStatus,
  KycDocumentReference,
  ReviewKycCaseCommand,
  SubmitKycCaseCommand,
} from './kyc.js';

export const KYC_API_ROUTES = {
  createDraft: '/v1/kyc/cases',
  getCase: '/v1/kyc/cases/:caseId',
  listCases: '/v1/kyc/cases',
  attachDocument: '/v1/kyc/cases/:caseId/documents',
  submitCase: '/v1/kyc/cases/:caseId/submit',
  reviewCase: '/v1/admin/kyc/cases/:caseId/review',
} as const;

export type KycApiRouteName = keyof typeof KYC_API_ROUTES;

export interface ListKycCasesQuery {
  readonly userId?: string;
  readonly status?: KycCaseStatus;
  readonly countryCode?: string;
  readonly programCode?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface AttachKycDocumentCommand {
  readonly caseId: string;
  readonly userId: string;
  readonly document: KycDocumentReference;
  readonly expectedVersion: number;
  readonly idempotencyKey: string;
}

export interface KycCasePage {
  readonly items: readonly KycCase[];
  readonly nextCursor?: string;
}

export interface KycApiContract {
  readonly createDraft: {
    readonly method: 'POST';
    readonly request: CreateKycDraftCommand;
    readonly response: KycCase;
  };
  readonly getCase: {
    readonly method: 'GET';
    readonly request: { readonly caseId: string };
    readonly response: KycCase;
  };
  readonly listCases: {
    readonly method: 'GET';
    readonly request: ListKycCasesQuery;
    readonly response: KycCasePage;
  };
  readonly attachDocument: {
    readonly method: 'POST';
    readonly request: AttachKycDocumentCommand;
    readonly response: KycCase;
  };
  readonly submitCase: {
    readonly method: 'POST';
    readonly request: SubmitKycCaseCommand;
    readonly response: KycCase;
  };
  readonly reviewCase: {
    readonly method: 'POST';
    readonly request: ReviewKycCaseCommand;
    readonly response: KycCase;
  };
}

export const KYC_API_METHODS: Readonly<
  Record<KycApiRouteName, KycApiContract[KycApiRouteName]['method']>
> = {
  createDraft: 'POST',
  getCase: 'GET',
  listCases: 'GET',
  attachDocument: 'POST',
  submitCase: 'POST',
  reviewCase: 'POST',
};
