const TRANSACTION_REFERENCE_PATTERN = /^MNSA-[A-Z]{2}-\d{8}-[A-Z0-9]{12}$/;

export class InvalidTransactionReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionReferenceError";
  }
}

export interface TransactionReferenceParts {
  readonly countryCode: string;
  readonly businessDate: string;
  readonly uniquePart: string;
}

export function createTransactionReference(input: TransactionReferenceParts): string {
  const countryCode = input.countryCode.trim().toUpperCase();
  const businessDate = input.businessDate.trim();
  const uniquePart = input.uniquePart.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new InvalidTransactionReferenceError(
      "countryCode must contain exactly two ASCII letters",
    );
  }

  if (!isValidBusinessDate(businessDate)) {
    throw new InvalidTransactionReferenceError(
      "businessDate must be a valid calendar date formatted as YYYYMMDD",
    );
  }

  if (!/^[A-Z0-9]{12}$/.test(uniquePart)) {
    throw new InvalidTransactionReferenceError(
      "uniquePart must contain exactly twelve uppercase alphanumeric characters",
    );
  }

  return `MNSA-${countryCode}-${businessDate}-${uniquePart}`;
}

export function parseTransactionReference(reference: string): TransactionReferenceParts {
  const normalized = reference.trim().toUpperCase();

  if (!TRANSACTION_REFERENCE_PATTERN.test(normalized)) {
    throw new InvalidTransactionReferenceError("invalid transaction reference format");
  }

  const [, countryCode, businessDate, uniquePart] = normalized.split("-");

  if (!countryCode || !businessDate || !uniquePart || !isValidBusinessDate(businessDate)) {
    throw new InvalidTransactionReferenceError("invalid transaction reference content");
  }

  return Object.freeze({ countryCode, businessDate, uniquePart });
}

export function isTransactionReference(value: string): boolean {
  try {
    parseTransactionReference(value);
    return true;
  } catch (error) {
    if (error instanceof InvalidTransactionReferenceError) {
      return false;
    }
    throw error;
  }
}

function isValidBusinessDate(value: string): boolean {
  if (!/^\d{8}$/.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
