BEGIN;

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('PLATFORM', 'USER', 'MERCHANT', 'PARTNER', 'PUBLIC_BODY')),
  owner_id TEXT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  currency CHAR(3) NOT NULL CHECK (currency IN ('XOF', 'EUR', 'USD')),
  country_code CHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  is_system_account BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (owner_type = 'PLATFORM' OR (owner_id IS NOT NULL AND length(btrim(owner_id)) > 0))
);

CREATE INDEX IF NOT EXISTS ledger_accounts_owner_idx
  ON ledger_accounts (owner_type, owner_id);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'POSTED', 'REVERSED', 'REJECTED')),
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  country_code CHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  occurred_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ NULL,
  reversed_by_transaction_id TEXT NULL REFERENCES ledger_transactions(id),
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(btrim(reference)) > 0),
  CHECK (length(btrim(transaction_type)) > 0),
  CHECK (length(btrim(idempotency_key)) >= 8),
  CHECK (length(btrim(correlation_id)) > 0)
);

CREATE INDEX IF NOT EXISTS ledger_transactions_reference_idx
  ON ledger_transactions (reference);

CREATE INDEX IF NOT EXISTS ledger_transactions_correlation_idx
  ON ledger_transactions (correlation_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
  sequence BIGINT NOT NULL CHECK (sequence >= 0),
  account_id TEXT NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
  direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL CHECK (currency IN ('XOF', 'EUR', 'USD')),
  description TEXT NULL,
  posted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_id, sequence)
);

CREATE INDEX IF NOT EXISTS ledger_entries_transaction_idx
  ON ledger_entries (transaction_id, sequence);

CREATE INDEX IF NOT EXISTS ledger_entries_account_posted_id_idx
  ON ledger_entries (account_id, posted_at ASC, id ASC);

COMMIT;
