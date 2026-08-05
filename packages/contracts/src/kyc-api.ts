import type {
  CreateKycDraftCommand,
  KycCase,
  KycCaseStatus,
  KycDocumentReference,
  KycLevel,
  KycProfileInput,
  ReviewKycCaseCommand,
  SubmitKycCaseCommand,
} from './kyc.js';
import type { PageRequest, PageResponse } from './pagination.js';

export const KYC_API_ROUTES = {
  createDraft: '/v1/kyc/cases',
  getCase: '/v1/kyc/cases/:caseId',
  listCases: '/v1/kyc/cases',
  updateProfile: '/v1/kyc/cases/:caseId/profile',
  addDocument: '/v1/kyc/cases/:caseId/documents',
  removeDocument: '/v1/kyc/cases/:caseId/documents/:documentId',
  submitCase: '/v1/kyc/cases/:caseId/submit',
  startReview: '/v1/admin/kyc/cases/:caseId/review/start',
  reviewCase: '/v1/admin/kyc/cases/:caseId/review',
  cancelCase: '/v1/kyc/cases/:caseId/cancel',
} as const;

export const KYC_API_METHODS = {
  createDraft: 'POST',
  getCase: 'GET',
  listCases: 'GET',
  updateProfile: 'PATCH',
  addDocument: 'POST',
  removeDocument: 'DELETE',
  submitCase: 'POST',
  startReview: 'POST',
  reviewCase: 'POST',
  cancelCase: 'POST',
} as const;

export type KycApiRouteName = keyof typeof KYC_API_ROUTES;

export interface ListKycCasesQuery extends PageRequest {
  readonly userId?: string;
  readonly countryCode?: string;
  readonly programCode?: string;
  readonly status?: KycCaseStatus;
  readonly resultingLevel?: KycLevel;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface UpdateKycProfileCommand {
  readonly caseId: string;
  readonly userId: string;
  readonly profile: KycProfileInput;
  readonly expectedVersion: number;
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

export interface StartKycReviewCommand {
  readonly caseId: string;
  readonly reviewerId: string;
  readonly expectedVersion: number;
  readonly idempotencyKey: string;
}

export interface CancelKycCaseCommand {
  readonly caseId: string;
  readonly actorId: string;
  readonly actorType: 'USER' | 'ADMIN' | 'SYSTEM';
  readonly expectedVersion: number;
  readonly reasonCode: string;
  readonly idempotencyKey: string;
}

export interface KycApiContract {
  readonly createDraft: {
    readonly method: typeof KYC_API_METHODS.createDraft;
    readonly path: typeof KYC_API_ROUTES.createDraft;
    readonly request: CreateKycDraftCommand & { readonly idempotencyKey: string };
    readonly response: KycCase;
  };
  readonly getCase: {
    readonly method: typeof KYC_API_METHODS.getCase;
    readonly path: typeof KYC_API_ROUTES.getCase;
    readonly request: { readonly caseId: string; readonly requesterId: string };
    readonly response: KycCase;
  };
  readonly listCases: {
    readonly method: typeof KYC_API_METHODS.listCases;
    readonly path: typeof KYC_API_ROUTES.listCases;
    readonly request: ListKycCasesQuery;
    readonly response: PageResponse<KycCase>;
  };
  readonly updateProfile: {
    readonly method: typeof KYC_API_METHODS.updateProfile;
    readonly path: typeof KYC_API_ROUTES.updateProfile;
    readonly request: UpdateKycProfileCommand & { readonly idempotencyKey: string };
    readonly response: KycCase;
  };
  readonly addDocument: {
    readonly method: typeof KYC_API_METHODS.addDocument;
    readonly path: typeof KYC_API_ROUTES.addDocument;
    readonly request: AddKycDocumentCommand & { readonly idempotencyKey: string };
    readonly response: KycCase;
  };
  readonly removeDocument: {
    readonly method: typeof KYC_API_METHODS.removeDocument;
    readonly path: typeof KYC_API_ROUTES.removeDocument;
    readonly request: RemoveKycDocumentCommand & { readonly idempotencyKey: string };
    readonly response: KycCase;
  };
  readonly submitCase: {
    readonly method: typeof KYC_API_METHODS.submitCase;
    readonly path: typeof KYC_API_ROUTES.submitCase;
    readonly request: SubmitKycCaseCommand;
    readonly response: KycCase;
  };
  readonly startReview: {
    readonly method: typeof KYC_API_METHODS.startReview;
    readonly path: typeof KYC_API_ROUTES.startReview;
    readonly request: StartKycReviewCommand;
    readonly response: KycCase;
  };
  readonly reviewCase: {
    readonly method: typeof KYC_API_METHODS.reviewCase;
    readonly path: typeof KYC_API_ROUTES.reviewCase;
    readonly request: ReviewKycCaseCommand & {
      readonly expectedVersion: number;
      readonly idempotencyKey: string;
    };
    readonly response: KycCase;
  };
  readonly cancelCase: {
    readonly method: typeof KYC_API_METHODS.cancelCase;
    readonly path: typeof KYC_API_ROUTES.cancelCase;
    readonly request: CancelKycCaseCommand;
    readonly response: KycCase;
  };
}
