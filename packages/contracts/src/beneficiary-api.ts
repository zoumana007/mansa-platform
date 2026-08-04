import type { PageRequest, PageResponse } from './pagination.js';
import type {
  Beneficiary,
  BeneficiaryStatus,
  BeneficiaryType,
  ChangeBeneficiaryStatusCommand,
  CreateBeneficiaryCommand,
  UpdateBeneficiaryCommand,
  VerifyBeneficiaryCommand,
} from './beneficiary.js';

export const BENEFICIARY_API_ROUTES = {
  createBeneficiary: '/v1/beneficiaries',
  listBeneficiaries: '/v1/beneficiaries',
  getBeneficiary: '/v1/beneficiaries/:beneficiaryId',
  updateBeneficiary: '/v1/beneficiaries/:beneficiaryId',
  verifyBeneficiary: '/v1/beneficiaries/:beneficiaryId/verification',
  changeBeneficiaryStatus: '/v1/beneficiaries/:beneficiaryId/status',
} as const;

export const BENEFICIARY_API_METHODS = {
  createBeneficiary: 'POST',
  listBeneficiaries: 'GET',
  getBeneficiary: 'GET',
  updateBeneficiary: 'PATCH',
  verifyBeneficiary: 'POST',
  changeBeneficiaryStatus: 'PATCH',
} as const;

export interface ListBeneficiariesQuery extends PageRequest {
  ownerUserId: string;
  type?: BeneficiaryType;
  status?: BeneficiaryStatus;
  trusted?: boolean;
  favorite?: boolean;
  search?: string;
}

export interface BeneficiaryApiContract {
  createBeneficiary: {
    method: typeof BENEFICIARY_API_METHODS.createBeneficiary;
    path: typeof BENEFICIARY_API_ROUTES.createBeneficiary;
    request: CreateBeneficiaryCommand;
    response: Beneficiary;
  };
  listBeneficiaries: {
    method: typeof BENEFICIARY_API_METHODS.listBeneficiaries;
    path: typeof BENEFICIARY_API_ROUTES.listBeneficiaries;
    request: ListBeneficiariesQuery;
    response: PageResponse<Beneficiary>;
  };
  getBeneficiary: {
    method: typeof BENEFICIARY_API_METHODS.getBeneficiary;
    path: typeof BENEFICIARY_API_ROUTES.getBeneficiary;
    request: { beneficiaryId: string; ownerUserId: string };
    response: Beneficiary;
  };
  updateBeneficiary: {
    method: typeof BENEFICIARY_API_METHODS.updateBeneficiary;
    path: typeof BENEFICIARY_API_ROUTES.updateBeneficiary;
    request: UpdateBeneficiaryCommand & { readonly idempotencyKey: string };
    response: Beneficiary;
  };
  verifyBeneficiary: {
    method: typeof BENEFICIARY_API_METHODS.verifyBeneficiary;
    path: typeof BENEFICIARY_API_ROUTES.verifyBeneficiary;
    request: VerifyBeneficiaryCommand & { readonly idempotencyKey: string };
    response: Beneficiary;
  };
  changeBeneficiaryStatus: {
    method: typeof BENEFICIARY_API_METHODS.changeBeneficiaryStatus;
    path: typeof BENEFICIARY_API_ROUTES.changeBeneficiaryStatus;
    request: ChangeBeneficiaryStatusCommand & { readonly idempotencyKey: string };
    response: Beneficiary;
  };
}
