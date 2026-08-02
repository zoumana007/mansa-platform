export const PAYMENT_ROUTE_STATUSES = ['ACTIVE', 'DEGRADED', 'DISABLED'] as const;
export const PAYMENT_ROUTE_STRATEGIES = ['PRIORITY', 'LOWEST_COST', 'HIGHEST_AVAILABILITY'] as const;

export type PaymentRouteStatus = (typeof PAYMENT_ROUTE_STATUSES)[number];
export type PaymentRouteStrategy = (typeof PAYMENT_ROUTE_STRATEGIES)[number];

export interface PaymentRouteCandidate {
  readonly routeId: string;
  readonly providerId: string;
  readonly operationType: string;
  readonly countryCode: string;
  readonly currency: string;
  readonly channel?: string;
  readonly status: PaymentRouteStatus;
  readonly priority: number;
  readonly estimatedCostMinor?: bigint;
  readonly availabilityBasisPoints?: number;
  readonly minimumAmountMinor?: bigint;
  readonly maximumAmountMinor?: bigint;
}

export interface SelectPaymentRouteCommand {
  readonly operationType: string;
  readonly countryCode: string;
  readonly currency: string;
  readonly amountMinor: bigint;
  readonly channel?: string;
  readonly strategy: PaymentRouteStrategy;
}

export interface PaymentRouteSelection {
  readonly selectedRoute: PaymentRouteCandidate;
  readonly eligibleRouteIds: readonly string[];
  readonly strategy: PaymentRouteStrategy;
}

export function isPaymentRouteStatus(value: string): value is PaymentRouteStatus {
  return PAYMENT_ROUTE_STATUSES.includes(value as PaymentRouteStatus);
}

export function isPaymentRouteStrategy(value: string): value is PaymentRouteStrategy {
  return PAYMENT_ROUTE_STRATEGIES.includes(value as PaymentRouteStrategy);
}

export function selectPaymentRoute(
  candidates: readonly PaymentRouteCandidate[],
  command: SelectPaymentRouteCommand,
): PaymentRouteSelection {
  if (command.amountMinor < 0n) throw new Error('amountMinor must be non-negative');

  const eligible = candidates.filter((candidate) => isEligible(candidate, command));
  if (eligible.length === 0) throw new Error('No eligible payment route');

  const sorted = [...eligible].sort((left, right) => compareRoutes(left, right, command.strategy));
  const selectedRoute = sorted[0];
  if (selectedRoute === undefined) throw new Error('No eligible payment route');

  return {
    selectedRoute,
    eligibleRouteIds: sorted.map((route) => route.routeId),
    strategy: command.strategy,
  };
}

function isEligible(candidate: PaymentRouteCandidate, command: SelectPaymentRouteCommand): boolean {
  if (candidate.status !== 'ACTIVE') return false;
  if (candidate.operationType !== command.operationType) return false;
  if (candidate.countryCode !== command.countryCode) return false;
  if (candidate.currency !== command.currency) return false;
  if (candidate.channel !== undefined && candidate.channel !== command.channel) return false;
  if (candidate.minimumAmountMinor !== undefined && command.amountMinor < candidate.minimumAmountMinor) return false;
  if (candidate.maximumAmountMinor !== undefined && command.amountMinor > candidate.maximumAmountMinor) return false;
  return true;
}

function compareRoutes(
  left: PaymentRouteCandidate,
  right: PaymentRouteCandidate,
  strategy: PaymentRouteStrategy,
): number {
  if (strategy === 'LOWEST_COST') {
    const leftCost = left.estimatedCostMinor ?? 0n;
    const rightCost = right.estimatedCostMinor ?? 0n;
    if (leftCost !== rightCost) return leftCost < rightCost ? -1 : 1;
  }

  if (strategy === 'HIGHEST_AVAILABILITY') {
    const leftAvailability = left.availabilityBasisPoints ?? 0;
    const rightAvailability = right.availabilityBasisPoints ?? 0;
    if (leftAvailability !== rightAvailability) return rightAvailability - leftAvailability;
  }

  if (left.priority !== right.priority) return left.priority - right.priority;
  return left.routeId.localeCompare(right.routeId);
}
