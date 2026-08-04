import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CardReference,
  CardStatus,
  CardType,
  ChangeCardStatusCommand,
  CreateCardCommand,
  UpdateCardControlsCommand,
  UpdateCardLimitsCommand,
} from './card.js';

export const CARD_API_ROUTES = {
  createCard: '/v1/cards',
  listCards: '/v1/cards',
  getCard: '/v1/cards/:cardId',
  changeCardStatus: '/v1/cards/:cardId/status',
  updateCardControls: '/v1/cards/:cardId/controls',
  updateCardLimits: '/v1/cards/:cardId/limits',
} as const;

export const CARD_API_METHODS = {
  createCard: 'POST',
  listCards: 'GET',
  getCard: 'GET',
  changeCardStatus: 'PATCH',
  updateCardControls: 'PATCH',
  updateCardLimits: 'PATCH',
} as const;

export type CardApiRouteName = keyof typeof CARD_API_ROUTES;

export interface ListCardsQuery extends PageRequest {
  readonly walletId?: string;
  readonly status?: CardStatus;
  readonly type?: CardType;
}

export interface CardApiContract {
  readonly createCard: {
    readonly method: typeof CARD_API_METHODS.createCard;
    readonly path: typeof CARD_API_ROUTES.createCard;
    readonly request: CreateCardCommand & { readonly idempotencyKey: string };
    readonly response: CardReference;
  };
  readonly listCards: {
    readonly method: typeof CARD_API_METHODS.listCards;
    readonly path: typeof CARD_API_ROUTES.listCards;
    readonly request: ListCardsQuery;
    readonly response: PageResponse<CardReference>;
  };
  readonly getCard: {
    readonly method: typeof CARD_API_METHODS.getCard;
    readonly path: typeof CARD_API_ROUTES.getCard;
    readonly request: { readonly cardId: string };
    readonly response: CardReference;
  };
  readonly changeCardStatus: {
    readonly method: typeof CARD_API_METHODS.changeCardStatus;
    readonly path: typeof CARD_API_ROUTES.changeCardStatus;
    readonly request: ChangeCardStatusCommand & { readonly idempotencyKey: string };
    readonly response: CardReference;
  };
  readonly updateCardControls: {
    readonly method: typeof CARD_API_METHODS.updateCardControls;
    readonly path: typeof CARD_API_ROUTES.updateCardControls;
    readonly request: UpdateCardControlsCommand & { readonly idempotencyKey: string };
    readonly response: CardReference;
  };
  readonly updateCardLimits: {
    readonly method: typeof CARD_API_METHODS.updateCardLimits;
    readonly path: typeof CARD_API_ROUTES.updateCardLimits;
    readonly request: UpdateCardLimitsCommand & { readonly idempotencyKey: string };
    readonly response: CardReference;
  };
}
