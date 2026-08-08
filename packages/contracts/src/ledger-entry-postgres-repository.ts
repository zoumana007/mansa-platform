import type { CurrencyCode, Money } from './money.js';
import type { LedgerEntry, LedgerEntryDirection } from './ledger.js';
import type {
  LedgerEntryRepository,
  LedgerEntryRepositoryQuery,
} from './ledger-entry-repository.js';

export interface PostgresQueryResult<Row> {
  readonly rows: readonly Row[];
}

/**
 * Minimal PostgreSQL client surface required by the Ledger repository.
 * Compatible with clients such as `pg.Pool` through a small application adapter.
 */
export interface PostgresLedgerEntryClient {
  readonly query: <Row>(
    text: string,
    values: readonly unknown[],
  ) => Promise<PostgresQueryResult<Row>>;
}

export interface PostgresLedgerEntryRow {
  readonly id: string;
  readonly transaction_id: string;
  readonly sequence: number;
  readonly account_id: string;
  readonly direction: string;
  readonly amount_minor: string | number | bigint;
  readonly currency: string;
  readonly description: string | null;
  readonly posted_at: string | Date;
}

const isLedgerEntryDirection = (value: string): value is LedgerEntryDirection =>
  value === 'DEBIT' || value === 'CREDIT';

const toIsoDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Ledger repository returned an invalid posted_at value.');
  }

  return date.toISOString();
};

const toMoney = (row: PostgresLedgerEntryRow): Money => {
  if (!/^[A-Z]{3}$/.test(row.currency)) {
    throw new Error('Ledger repository returned an invalid currency.');
  }

  let amountMinor: bigint;
  try {
    amountMinor = BigInt(row.amount_minor);
  } catch {
    throw new Error('Ledger repository returned an invalid amount_minor value.');
  }

  return {
    currency: row.currency as CurrencyCode,
    amountMinor,
  };
};

const mapRow = (row: PostgresLedgerEntryRow): LedgerEntry => {
  if (!isLedgerEntryDirection(row.direction)) {
    throw new Error('Ledger repository returned an invalid direction.');
  }

  return {
    id: row.id,
    transactionId: row.transaction_id,
    sequence: row.sequence,
    accountId: row.account_id,
    direction: row.direction,
    amount: toMoney(row),
    ...(row.description === null ? {} : { description: row.description }),
    postedAt: toIsoDateTime(row.posted_at),
  };
};

export interface LedgerEntryPostgresStatement {
  readonly text: string;
  readonly values: readonly unknown[];
}

/**
 * Builds a parameterized PostgreSQL keyset query using the canonical order
 * `(posted_at ASC, id ASC)`. No user-controlled value is interpolated into SQL.
 */
export function buildLedgerEntryPostgresStatement(
  query: LedgerEntryRepositoryQuery,
): LedgerEntryPostgresStatement {
  const predicates = ['account_id = $1'];
  const values: unknown[] = [query.accountId];

  if (query.from !== undefined) {
    values.push(query.from);
    predicates.push(`posted_at >= $${values.length}`);
  }

  if (query.to !== undefined) {
    values.push(query.to);
    predicates.push(`posted_at <= $${values.length}`);
  }

  if (query.after !== undefined) {
    values.push(query.after.postedAt);
    const postedAtParameter = `$${values.length}`;
    values.push(query.after.entryId);
    const entryIdParameter = `$${values.length}`;
    predicates.push(
      `(posted_at > ${postedAtParameter} OR (posted_at = ${postedAtParameter} AND id > ${entryIdParameter}))`,
    );
  }

  values.push(query.take);
  const takeParameter = `$${values.length}`;

  return {
    text: [
      'SELECT',
      '  id, transaction_id, sequence, account_id, direction,',
      '  amount_minor, currency, description, posted_at',
      'FROM ledger_entries',
      `WHERE ${predicates.join(' AND ')}`,
      'ORDER BY posted_at ASC, id ASC',
      `LIMIT ${takeParameter}`,
    ].join('\n'),
    values,
  };
}

/**
 * Concrete PostgreSQL implementation of the storage-agnostic Ledger repository.
 */
export class PostgresLedgerEntryRepository implements LedgerEntryRepository {
  public constructor(private readonly client: PostgresLedgerEntryClient) {}

  public async listEntries(
    query: LedgerEntryRepositoryQuery,
  ): Promise<readonly LedgerEntry[]> {
    const statement = buildLedgerEntryPostgresStatement(query);
    const result = await this.client.query<PostgresLedgerEntryRow>(
      statement.text,
      statement.values,
    );

    return result.rows.map(mapRow);
  }
}
