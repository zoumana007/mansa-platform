import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CancelPublicObligationCommand,
  CollectPublicPaymentCommand,
  CreatePublicObligationCommand,
  DecideScholarshipCommand,
  DisputePublicObligationCommand,
  IssuePublicObligationCommand,
  IssueStudentCardCommand,
  PublicObligation,
  PublicObligationStatus,
  PublicObligationType,
  PublicOrganization,
  PublicPaymentReceipt,
  PublicServiceCatalogEntry,
  ScholarshipApplication,
  ScholarshipStatus,
  StudentCard,
  StudentCardStatus,
} from './public-services.js';

export const PUBLIC_SERVICES_API_ROUTES = {
  listOrganizations: '/v1/public-services/organizations',
  listCatalogEntries: '/v1/public-services/catalog',
  createObligation: '/v1/public-services/obligations',
  listObligations: '/v1/public-services/obligations',
  getObligation: '/v1/public-services/obligations/:obligationId',
  issueObligation: '/v1/public-services/obligations/:obligationId/issuance',
  disputeObligation: '/v1/public-services/obligations/:obligationId/disputes',
  cancelObligation: '/v1/public-services/obligations/:obligationId/cancellation',
  collectPayment: '/v1/public-services/obligations/:obligationId/payments',
  getReceipt: '/v1/public-services/receipts/:receiptId',
  listScholarships: '/v1/public-services/scholarships',
  decideScholarship: '/v1/public-services/scholarships/:applicationId/decision',
  issueStudentCard: '/v1/public-services/student-cards',
  listStudentCards: '/v1/public-services/student-cards',
  getStudentCard: '/v1/public-services/student-cards/:cardId',
} as const;

export const PUBLIC_SERVICES_API_METHODS = {
  listOrganizations: 'GET',
  listCatalogEntries: 'GET',
  createObligation: 'POST',
  listObligations: 'GET',
  getObligation: 'GET',
  issueObligation: 'POST',
  disputeObligation: 'POST',
  cancelObligation: 'POST',
  collectPayment: 'POST',
  getReceipt: 'GET',
  listScholarships: 'GET',
  decideScholarship: 'POST',
  issueStudentCard: 'POST',
  listStudentCards: 'GET',
  getStudentCard: 'GET',
} as const;

export type PublicServicesApiRouteName = keyof typeof PUBLIC_SERVICES_API_ROUTES;

export interface ListPublicOrganizationsQuery extends PageRequest {
  countryCode?: string;
  administrativeAreaCode?: string;
  active?: boolean;
}

export interface ListPublicServiceCatalogQuery extends PageRequest {
  organizationId?: string;
  obligationType?: PublicObligationType;
  active?: boolean;
}

export interface ListPublicObligationsQuery extends PageRequest {
  organizationId?: string;
  serviceCode?: string;
  subjectUserId?: string;
  externalReference?: string;
  status?: PublicObligationStatus;
}

export interface ListScholarshipApplicationsQuery extends PageRequest {
  organizationId?: string;
  programCode?: string;
  academicYear?: string;
  beneficiaryUserId?: string;
  status?: ScholarshipStatus;
}

export interface ListStudentCardsQuery extends PageRequest {
  organizationId?: string;
  studentUserId?: string;
  studentExternalReference?: string;
  academicYear?: string;
  status?: StudentCardStatus;
}

export interface PublicServicesApiContract {
  listOrganizations: {
    method: typeof PUBLIC_SERVICES_API_METHODS.listOrganizations;
    path: typeof PUBLIC_SERVICES_API_ROUTES.listOrganizations;
    request: ListPublicOrganizationsQuery;
    response: PageResponse<PublicOrganization>;
  };
  listCatalogEntries: {
    method: typeof PUBLIC_SERVICES_API_METHODS.listCatalogEntries;
    path: typeof PUBLIC_SERVICES_API_ROUTES.listCatalogEntries;
    request: ListPublicServiceCatalogQuery;
    response: PageResponse<PublicServiceCatalogEntry>;
  };
  createObligation: {
    method: typeof PUBLIC_SERVICES_API_METHODS.createObligation;
    path: typeof PUBLIC_SERVICES_API_ROUTES.createObligation;
    request: CreatePublicObligationCommand;
    response: PublicObligation;
  };
  listObligations: {
    method: typeof PUBLIC_SERVICES_API_METHODS.listObligations;
    path: typeof PUBLIC_SERVICES_API_ROUTES.listObligations;
    request: ListPublicObligationsQuery;
    response: PageResponse<PublicObligation>;
  };
  getObligation: {
    method: typeof PUBLIC_SERVICES_API_METHODS.getObligation;
    path: typeof PUBLIC_SERVICES_API_ROUTES.getObligation;
    request: { obligationId: string };
    response: PublicObligation;
  };
  issueObligation: {
    method: typeof PUBLIC_SERVICES_API_METHODS.issueObligation;
    path: typeof PUBLIC_SERVICES_API_ROUTES.issueObligation;
    request: IssuePublicObligationCommand;
    response: PublicObligation;
  };
  disputeObligation: {
    method: typeof PUBLIC_SERVICES_API_METHODS.disputeObligation;
    path: typeof PUBLIC_SERVICES_API_ROUTES.disputeObligation;
    request: DisputePublicObligationCommand;
    response: PublicObligation;
  };
  cancelObligation: {
    method: typeof PUBLIC_SERVICES_API_METHODS.cancelObligation;
    path: typeof PUBLIC_SERVICES_API_ROUTES.cancelObligation;
    request: CancelPublicObligationCommand;
    response: PublicObligation;
  };
  collectPayment: {
    method: typeof PUBLIC_SERVICES_API_METHODS.collectPayment;
    path: typeof PUBLIC_SERVICES_API_ROUTES.collectPayment;
    request: CollectPublicPaymentCommand;
    response: PublicPaymentReceipt;
  };
  getReceipt: {
    method: typeof PUBLIC_SERVICES_API_METHODS.getReceipt;
    path: typeof PUBLIC_SERVICES_API_ROUTES.getReceipt;
    request: { receiptId: string };
    response: PublicPaymentReceipt;
  };
  listScholarships: {
    method: typeof PUBLIC_SERVICES_API_METHODS.listScholarships;
    path: typeof PUBLIC_SERVICES_API_ROUTES.listScholarships;
    request: ListScholarshipApplicationsQuery;
    response: PageResponse<ScholarshipApplication>;
  };
  decideScholarship: {
    method: typeof PUBLIC_SERVICES_API_METHODS.decideScholarship;
    path: typeof PUBLIC_SERVICES_API_ROUTES.decideScholarship;
    request: DecideScholarshipCommand;
    response: ScholarshipApplication;
  };
  issueStudentCard: {
    method: typeof PUBLIC_SERVICES_API_METHODS.issueStudentCard;
    path: typeof PUBLIC_SERVICES_API_ROUTES.issueStudentCard;
    request: IssueStudentCardCommand;
    response: StudentCard;
  };
  listStudentCards: {
    method: typeof PUBLIC_SERVICES_API_METHODS.listStudentCards;
    path: typeof PUBLIC_SERVICES_API_ROUTES.listStudentCards;
    request: ListStudentCardsQuery;
    response: PageResponse<StudentCard>;
  };
  getStudentCard: {
    method: typeof PUBLIC_SERVICES_API_METHODS.getStudentCard;
    path: typeof PUBLIC_SERVICES_API_ROUTES.getStudentCard;
    request: { cardId: string };
    response: StudentCard;
  };
}
