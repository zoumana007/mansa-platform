import type {
  CreateKycDraftCommand,
  KycCase,
  KycCaseStatus,
  KycDocumentReference,
  ReviewKycCaseCommand,
  SubmitKycCaseCommand,
} from './kyc.js';
import type { PageRequest, PageResponse } from './pagination.js';

export const KYC_API_ROUTES = {
  createDraft: '/v1/kyc/cases',
  getCase: '/v1/kyc/cases/:caseId',
  listCases: '/v1/kyc/cases',
  addDocument: '/v1/kyc/cases/:caseId/documents',
  removeDocument: '/v1/kyc/cases/:caseId/documents/:documentId',
  submitCase: '/v1/kyc/cases/:caseId/submit',
  reviewCase: '/v1/admin/kyc/cases/:caseId/review',
} as const;

export const KYC_API_METHODS = {
  createDraft: 'POST',
  getCase: 'GET',
  listCases: 'GET',
  addDocument: 'POST',
  removeDocument: 'DELETE',
  submitCase: 'POST',
  reviewCase: 'POST',
} as const;

export type KycApiRouteName = keyof typeof KYC_API_ROUTES;

export interface ListKycCasesQuery extends PageRequest {
  readonly userId?: string;
  readonly countryCode?: string;
  readonly programCode?: string;
  readonly status?: KycCaseStatus;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface AddKycDocumentCommand {
  readonly caseId: string;
  readonly userId: string;
  readonly document: KycDocumentReference;
  readonly expectedVersion: number;
}

export interface RemoveKycDocumentCommand {
  readonly caseId: string;
  readonly userId: string;
  readonly documentId: string;
  readonly expectedVersion: number;
}

export interface KycApiContract {
  readonly createDraft: {
    readonly request: CreateKycDraftCommand;
    readonly response: KycCase;
  };
  readonly getCase: {
    readonly request: { readonly caseId: string };
    readonly response: KycCase;
  };
  readonly listCases: {
    readonly request: ListKycCasesQuery;
    readonly response: PageResponse<KycCase>;
  };
  readonly addDocument: {
    readonly request: AddKycDocumentCommand;
    readonly response: KycCase;
  };
  readonly removeDocument: {
    readonly request: RemoveKycDocumentCommand;
    readonly response: KycCase;
  };
  readonly submitCase: {
    readonly request: SubmitKycCaseCommand;
    readonly response: KycCase;
  };
  readonly reviewCase: {
    readonly request: ReviewKycCaseCommand;
    readonly response: KycCase;
  };
}
