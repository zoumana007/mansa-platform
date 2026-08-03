import type {
  AuthenticationResult,
  PasswordSignInCommand,
  RefreshSessionCommand,
  RegisterUserCommand,
  RequestOtpCommand,
  RevokeSessionCommand,
  VerifyOtpCommand,
} from './authentication.js';
import type { DeviceSession, UserIdentity } from './identity.js';

export const IDENTITY_API_ROUTES = {
  register: '/v1/auth/register',
  passwordSignIn: '/v1/auth/sign-in/password',
  requestOtp: '/v1/auth/otp/request',
  verifyOtp: '/v1/auth/otp/verify',
  refreshSession: '/v1/auth/sessions/refresh',
  listSessions: '/v1/auth/sessions',
  revokeSession: '/v1/auth/sessions/:sessionId/revoke',
  getCurrentUser: '/v1/users/me',
} as const;

export type IdentityApiRouteName = keyof typeof IDENTITY_API_ROUTES;

export interface IdentityApiContract {
  readonly register: {
    readonly method: 'POST';
    readonly request: RegisterUserCommand;
    readonly response: AuthenticationResult;
  };
  readonly passwordSignIn: {
    readonly method: 'POST';
    readonly request: PasswordSignInCommand;
    readonly response: AuthenticationResult;
  };
  readonly requestOtp: {
    readonly method: 'POST';
    readonly request: RequestOtpCommand;
    readonly response: { readonly challengeId: string; readonly expiresAt: string };
  };
  readonly verifyOtp: {
    readonly method: 'POST';
    readonly request: VerifyOtpCommand;
    readonly response: AuthenticationResult;
  };
  readonly refreshSession: {
    readonly method: 'POST';
    readonly request: RefreshSessionCommand;
    readonly response: AuthenticationResult;
  };
  readonly listSessions: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: readonly DeviceSession[];
  };
  readonly revokeSession: {
    readonly method: 'POST';
    readonly request: RevokeSessionCommand;
    readonly response: { readonly revoked: true; readonly revokedAt: string };
  };
  readonly getCurrentUser: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: UserIdentity;
  };
}

export const IDENTITY_API_METHODS: Readonly<
  Record<IdentityApiRouteName, IdentityApiContract[IdentityApiRouteName]['method']>
> = {
  register: 'POST',
  passwordSignIn: 'POST',
  requestOtp: 'POST',
  verifyOtp: 'POST',
  refreshSession: 'POST',
  listSessions: 'GET',
  revokeSession: 'POST',
  getCurrentUser: 'GET',
};
