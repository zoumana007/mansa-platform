import type {
  ChangeDirectoryProfileStatusCommand,
  CreateDirectoryProfileCommand,
  DirectoryProfile,
  DirectorySearchQuery,
  DirectorySearchResult,
  UpdateDirectoryProfileCommand,
} from './directory.js';
import type { PageResponse } from './pagination.js';

export const DIRECTORY_API_ROUTES = {
  createProfile: '/v1/directory/profiles',
  listProfiles: '/v1/directory/profiles',
  getProfile: '/v1/directory/profiles/:profileId',
  updateProfile: '/v1/directory/profiles/:profileId',
  changeProfileStatus: '/v1/directory/profiles/:profileId/status',
  search: '/v1/directory/search',
  getPublicProfile: '/v1/directory/public/:slug',
} as const;

export const DIRECTORY_API_METHODS = {
  createProfile: 'POST',
  listProfiles: 'GET',
  getProfile: 'GET',
  updateProfile: 'PATCH',
  changeProfileStatus: 'POST',
  search: 'GET',
  getPublicProfile: 'GET',
} as const;

export type DirectoryApiRouteName = keyof typeof DIRECTORY_API_ROUTES;

export interface ListDirectoryProfilesQuery {
  merchantId?: string;
  locationId?: string;
  status?: string;
  countryCode?: string;
  page?: number;
  limit?: number;
}

export interface DirectoryApiContract {
  createProfile: {
    request: CreateDirectoryProfileCommand;
    response: DirectoryProfile;
  };
  listProfiles: {
    request: ListDirectoryProfilesQuery;
    response: PageResponse<DirectoryProfile>;
  };
  getProfile: {
    request: { profileId: string };
    response: DirectoryProfile;
  };
  updateProfile: {
    request: UpdateDirectoryProfileCommand;
    response: DirectoryProfile;
  };
  changeProfileStatus: {
    request: ChangeDirectoryProfileStatusCommand;
    response: DirectoryProfile;
  };
  search: {
    request: DirectorySearchQuery;
    response: PageResponse<DirectorySearchResult>;
  };
  getPublicProfile: {
    request: { slug: string };
    response: DirectoryProfile;
  };
}
