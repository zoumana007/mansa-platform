export type MansaHandlePolicy = Readonly<{
  minLength: number;
  maxLength: number;
  reserved: ReadonlySet<string>;
}>;

export class InvalidMansaHandleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMansaHandleError";
  }
}

const DEFAULT_POLICY: MansaHandlePolicy = {
  minLength: 3,
  maxLength: 30,
  reserved: new Set([
    "admin",
    "administration",
    "support",
    "mansa",
    "bank",
    "banque",
    "etat",
    "state",
    "universite",
    "university",
  ]),
};

function normalizePolicy(policy?: Partial<MansaHandlePolicy>): MansaHandlePolicy {
  const minLength = policy?.minLength ?? DEFAULT_POLICY.minLength;
  const maxLength = policy?.maxLength ?? DEFAULT_POLICY.maxLength;
  const reserved = policy?.reserved ?? DEFAULT_POLICY.reserved;

  if (!Number.isInteger(minLength) || minLength < 1) {
    throw new InvalidMansaHandleError("minLength must be a positive integer");
  }

  if (!Number.isInteger(maxLength) || maxLength < minLength) {
    throw new InvalidMansaHandleError(
      "maxLength must be an integer greater than or equal to minLength",
    );
  }

  return { minLength, maxLength, reserved };
}

/**
 * Public, normalized and framework-independent identifier used by Mansa Connect.
 * The leading @ is accepted at input boundaries but is not stored internally.
 */
export class MansaHandle {
  private constructor(public readonly value: string) {}

  static create(
    rawValue: string,
    policy?: Partial<MansaHandlePolicy>,
  ): MansaHandle {
    const effectivePolicy = normalizePolicy(policy);
    const normalized = rawValue.trim().toLowerCase().replace(/^@/, "");

    if (normalized.length < effectivePolicy.minLength) {
      throw new InvalidMansaHandleError(
        `handle must contain at least ${effectivePolicy.minLength} characters`,
      );
    }

    if (normalized.length > effectivePolicy.maxLength) {
      throw new InvalidMansaHandleError(
        `handle must contain at most ${effectivePolicy.maxLength} characters`,
      );
    }

    if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(normalized)) {
      throw new InvalidMansaHandleError(
        "handle may contain lowercase letters, digits, dots, underscores and hyphens, and must start and end with a letter or digit",
      );
    }

    const reserved = new Set(
      [...effectivePolicy.reserved].map((value) =>
        value.trim().toLowerCase().replace(/^@/, ""),
      ),
    );

    if (reserved.has(normalized)) {
      throw new InvalidMansaHandleError("handle is reserved");
    }

    return new MansaHandle(normalized);
  }

  equals(other: MansaHandle): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return `@${this.value}`;
  }

  toJSON(): { value: string; display: string } {
    return { value: this.value, display: this.toString() };
  }
}
