export type LedgerWriteDirection = 'DEBIT' | 'CREDIT';

export interface LedgerWriteEntryInput {
  readonly accountId: string;
  readonly direction: LedgerWriteDirection;
  readonly amountMinor: string;
  readonly currency: string;
  readonly description?: string;
}

export interface LedgerWriteRequest {
  readonly reference: string;
  readonly transactionType: string;
  readonly entries: readonly LedgerWriteEntryInput[];
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly countryCode: string;
  readonly occurredAt: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface NormalizedLedgerWriteEntry {
  readonly accountId: string;
  readonly direction: LedgerWriteDirection;
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly description?: string;
}

export interface NormalizedLedgerWriteRequest {
  readonly reference: string;
  readonly transactionType: string;
  readonly entries: readonly NormalizedLedgerWriteEntry[];
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly countryCode: string;
  readonly occurredAt: Date;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface LedgerWriteValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly value?: NormalizedLedgerWriteRequest;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isCurrency = (value: string): boolean => /^[A-Z]{3}$/.test(value);

const isCountryCode = (value: string): boolean => /^[A-Z]{2}$/.test(value);

const isPositiveMinorAmount = (value: string): boolean => /^[1-9]\d*$/.test(value);

export function validateLedgerWriteRequest(input: unknown): LedgerWriteValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['body must be an object.'] };
  }

  const reference = typeof input.reference === 'string' ? input.reference.trim() : '';
  const transactionType =
    typeof input.transactionType === 'string' ? input.transactionType.trim() : '';
  const idempotencyKey =
    typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
  const correlationId =
    typeof input.correlationId === 'string' ? input.correlationId.trim() : '';
  const countryCode = typeof input.countryCode === 'string' ? input.countryCode.trim() : '';
  const occurredAtText = typeof input.occurredAt === 'string' ? input.occurredAt.trim() : '';

  if (reference.length === 0) errors.push('reference is required.');
  if (transactionType.length === 0) errors.push('transactionType is required.');
  if (idempotencyKey.length < 8) errors.push('idempotencyKey must contain at least 8 characters.');
  if (correlationId.length === 0) errors.push('correlationId is required.');
  if (!isCountryCode(countryCode)) errors.push('countryCode must be an ISO alpha-2 code.');

  const occurredAt = new Date(occurredAtText);
  if (occurredAtText.length === 0 || Number.isNaN(occurredAt.getTime())) {
    errors.push('occurredAt must be a valid ISO-8601 date-time.');
  }

  const metadata: Record<string, string> | undefined = (() => {
    if (input.metadata === undefined) return undefined;
    if (!isRecord(input.metadata)) {
      errors.push('metadata must be an object of string values.');
      return undefined;
    }
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.metadata)) {
      if (typeof value !== 'string') {
        errors.push(`metadata.${key} must be a string.`);
      } else {
        result[key] = value;
      }
    }
    return result;
  })();

  if (!Array.isArray(input.entries) || input.entries.length < 2) {
    errors.push('entries must contain at least two ledger entries.');
  }

  const normalizedEntries: NormalizedLedgerWriteEntry[] = [];
  const currencies = new Set<string>();
  let debitTotal = 0n;
  let creditTotal = 0n;

  if (Array.isArray(input.entries)) {
    input.entries.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`entries.${index} must be an object.`);
        return;
      }

      const accountId = typeof entry.accountId === 'string' ? entry.accountId.trim() : '';
      const direction = entry.direction;
      const amountMinor = typeof entry.amountMinor === 'string' ? entry.amountMinor.trim() : '';
      const currency = typeof entry.currency === 'string' ? entry.currency.trim() : '';
      const description =
        typeof entry.description === 'string' && entry.description.trim().length > 0
          ? entry.description.trim()
          : undefined;

      if (!isUuid(accountId)) errors.push(`entries.${index}.accountId must be a UUID v4.`);
      if (direction !== 'DEBIT' && direction !== 'CREDIT') {
        errors.push(`entries.${index}.direction must be DEBIT or CREDIT.`);
      }
      if (!isPositiveMinorAmount(amountMinor)) {
        errors.push(`entries.${index}.amountMinor must be a positive integer string.`);
      }
      if (!isCurrency(currency)) errors.push(`entries.${index}.currency must be a 3-letter code.`);

      if (
        isUuid(accountId) &&
        (direction === 'DEBIT' || direction === 'CREDIT') &&
        isPositiveMinorAmount(amountMinor) &&
        isCurrency(currency)
      ) {
        const amount = BigInt(amountMinor);
        currencies.add(currency);
        if (direction === 'DEBIT') debitTotal += amount;
        else creditTotal += amount;
        normalizedEntries.push({
          accountId,
          direction,
          amountMinor: amount,
          currency,
          ...(description === undefined ? {} : { description }),
        });
      }
    });
  }

  if (currencies.size > 1) errors.push('all entries must use the same currency.');
  if (normalizedEntries.length >= 2 && debitTotal !== creditTotal) {
    errors.push('ledger debit and credit totals must be equal.');
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    value: {
      reference,
      transactionType,
      entries: normalizedEntries,
      idempotencyKey,
      correlationId,
      countryCode,
      occurredAt,
      ...(metadata === undefined ? {} : { metadata }),
    },
  };
}
