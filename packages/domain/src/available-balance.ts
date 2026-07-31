export interface BalanceReservation {
  readonly id: string;
  readonly amountMinor: bigint;
  readonly status: "ACTIVE" | "RELEASED" | "CAPTURED" | "EXPIRED";
}

export interface AvailableBalance {
  readonly ledgerBalanceMinor: bigint;
  readonly reservedMinor: bigint;
  readonly availableMinor: bigint;
}

export class InvalidAvailableBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAvailableBalanceError";
  }
}

export function calculateAvailableBalance(
  ledgerBalanceMinor: bigint,
  reservations: readonly BalanceReservation[],
): AvailableBalance {
  let reservedMinor = 0n;
  const activeIds = new Set<string>();

  for (const reservation of reservations) {
    const normalizedId = reservation.id.trim();
    if (!normalizedId) {
      throw new InvalidAvailableBalanceError("reservation id is required");
    }
    if (reservation.amountMinor <= 0n) {
      throw new InvalidAvailableBalanceError("reservation amountMinor must be positive");
    }
    if (reservation.status !== "ACTIVE") continue;
    if (activeIds.has(normalizedId)) {
      throw new InvalidAvailableBalanceError("duplicate active reservation id");
    }

    activeIds.add(normalizedId);
    reservedMinor += reservation.amountMinor;
  }

  return Object.freeze({
    ledgerBalanceMinor,
    reservedMinor,
    availableMinor: ledgerBalanceMinor - reservedMinor,
  });
}

export function assertSufficientAvailableBalance(
  availableMinor: bigint,
  requestedMinor: bigint,
): void {
  if (requestedMinor <= 0n) {
    throw new InvalidAvailableBalanceError("requestedMinor must be positive");
  }
  if (availableMinor < requestedMinor) {
    throw new InvalidAvailableBalanceError("insufficient available balance");
  }
}
