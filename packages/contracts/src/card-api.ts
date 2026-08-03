import type {
  CardReference,
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

export type CardApiRouteName = keyof typeof CARD_API_ROUTES;

export interface ListCardsQuery {
  readonly walletId?: string;
  readonly status?: CardReference['status'];
  readonly type?: CardReference['type'];
}

export interface CardApiContract {
  readonly createCard: {
    readonly method: 'POST';
    readonly request: CreateCardCommand;
    readonly response: CardReference;
  };
  readonly listCards: {
    readonly method: 'GET';
    readonly request: ListCardsQuery;
    readonly response: readonly CardReference[];
  };
  readonly getCard: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: CardReference;
  };
  readonly changeCardStatus: {
    readonly method: 'POST';
    readonly request: ChangeCardStatusCommand;
    readonly response: CardReference;
  };
  readonly updateCardControls: {
    readonly method: 'PUT';
    readonly request: UpdateCardControlsCommand;
    readonly response: CardReference;
  };
  readonly updateCardLimits: {
    readonly method: 'PUT';
    readonly request: UpdateCardLimitsCommand;
    readonly response: CardReference;
  };
}

export const CARD_API_METHODS: Readonly<
  Record<CardApiRouteName, CardApiContract[CardApiRouteName]['method']>
> = {
  createCard: 'POST',
  listCards: 'GET',
  getCard: 'GET',
  changeCardStatus: 'POST',
  updateCardControls: 'PUT',
  updateCardLimits: 'PUT',
};
