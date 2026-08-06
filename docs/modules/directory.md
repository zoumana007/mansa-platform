# Module Directory

## Purpose

The Directory module powers merchant discovery and public mini-sites across mobile and web clients. It is intentionally separated from merchant onboarding, payments and subscription billing so each capability can evolve behind explicit contracts.

## Shared contracts

- `packages/contracts/src/directory.ts` contains the domain types, status transitions, geo-point validation and search model.
- `packages/contracts/src/directory-api.ts` contains the HTTP route and method catalogue.
- `packages/contracts/src/api-contracts.ts` re-exports the API contract.
- `packages/contracts/src/index.ts` re-exports domain and API symbols.

Consumers should import from `@mansa/contracts` or the generated package entry points. They must not duplicate status values locally.

## Target backend boundaries

The API gateway module should be split into the following units:

- `DirectoryApplicationService`: command and query orchestration;
- `DirectoryProfileRepository`: persistence abstraction;
- `DirectorySearchIndex`: text and geo search abstraction;
- `DirectoryMediaService`: controlled asset references and moderation status;
- `DirectoryModerationPolicy`: publication and suspension decisions;
- `DirectorySubscriptionPolicy`: feature entitlement resolution;
- `DirectoryAuditPublisher`: immutable audit event publication.

External search engines, object storage and billing providers must be hidden behind adapters.

## Persistence model

A production implementation should keep separate records for:

- directory profiles;
- categories and profile-category relations;
- contacts;
- opening periods;
- media asset references;
- moderation decisions;
- featured-placement periods;
- subscription entitlement snapshots;
- status transition history;
- idempotency records.

Recommended indexes include unique slug by country, merchant/location lookup, publication status, categories, city and a geospatial index. Public search must exclude drafts, suspended profiles and archived profiles at the repository boundary.

## Command rules

### Create profile

- Require `merchantId`, `slug`, `displayName`, `shortDescription`, at least one category, `countryCode`, `actorId` and `idempotencyKey`.
- Normalize the slug before uniqueness checks.
- Start in `DRAFT` unless an explicit trusted migration policy applies.
- Return the previous result when the idempotency key is replayed with the same payload.
- Reject reuse of an idempotency key with a different payload.

### Update profile

- Authorize against the merchant and location scope.
- Validate geo coordinates, contacts, opening periods and media ownership.
- A material change to a published profile may return it to `PENDING_REVIEW` according to country policy.

### Change status

- Use `canTransitionDirectoryProfileStatus` before persistence.
- Require a reason for suspension or archival.
- Audit actor, previous state, new state, reason, request correlation and timestamp.
- Treat the command as idempotent.

## Query rules

- Apply pagination limits at the API boundary.
- Never expose a private contact value.
- Distinguish organic relevance from sponsored placement.
- Return distance only when a valid origin is supplied.
- Apply country and publication filters before ranking.
- Keep ranking configuration outside application releases.

## Security and privacy

- Do not index KYC documents, settlement details, card data or employee personal data.
- Sanitize descriptions and public links before rendering.
- Validate media type, size, malware scan status and ownership.
- Rate-limit public search and profile views.
- Record administrative publication, suspension, archival and featured-placement actions.
- Use opaque asset identifiers; never expose storage credentials or internal bucket paths.

## Events

The implementation should publish versioned events such as:

- `directory.profile.created.v1`;
- `directory.profile.updated.v1`;
- `directory.profile.submitted.v1`;
- `directory.profile.published.v1`;
- `directory.profile.suspended.v1`;
- `directory.profile.archived.v1`;
- `directory.profile.featured.v1`.

Events must contain identifiers and safe metadata only. Consumers fetch protected details through authorized APIs.

## Validation checklist

Before enabling the module in Recette:

1. TypeScript contracts compile in strict mode.
2. Status transition tests cover every allowed and rejected transition.
3. Geo validation covers boundaries, non-finite values and missing origins.
4. Idempotency tests cover replay and payload mismatch.
5. Search excludes every non-public state.
6. Authorization tests cover merchant, location, moderator and administrator scopes.
7. Audit events are produced for every sensitive transition.
8. Logs contain no private contact values, secrets or KYC data.
9. Featured placement expires automatically.
10. Documentation and route constants remain synchronized.

## Remaining implementation

This document defines the target boundary; it does not claim that persistence or runtime endpoints already exist. The next implementation lot should add the repository interface, application service, in-memory contract tests and API module skeleton before introducing PostgreSQL or an external search engine.
