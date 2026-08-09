export type RuntimeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface LedgerOutboxWorkerRuntimeConfig {
  enabled: boolean;
  intervalMs: number;
  batchSize: number;
  leaseMs: number;
  maxAttempts: number;
  baseRetryDelayMs: number;
  maxRetryDelayMs: number;
  jitterRatio: number;
}

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  host: string;
  port: number;
  trustProxy: boolean;
  ledgerOutboxWorker: LedgerOutboxWorkerRuntimeConfig;
}

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
const ALLOWED_ENVIRONMENTS = new Set<RuntimeEnvironment>([
  'development',
  'test',
  'staging',
  'production',
]);

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_PORT;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function parseEnvironment(value: string | undefined): RuntimeEnvironment {
  const environment = value ?? 'development';
  if (!ALLOWED_ENVIRONMENTS.has(environment as RuntimeEnvironment)) {
    throw new Error(
      'NODE_ENV must be one of development, test, staging or production',
    );
  }

  return environment as RuntimeEnvironment;
}

function parseBoolean(name: string, value: string | undefined): boolean {
  if (value === undefined || value === '') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be either true or false`);
}

function parsePositiveInteger(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseRatio(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${name} must be a number between 0 and 1`);
  }
  return parsed;
}

export function loadRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const host = environment.HOST?.trim() || DEFAULT_HOST;

  return {
    environment: parseEnvironment(environment.NODE_ENV),
    host,
    port: parsePort(environment.PORT),
    trustProxy: parseBoolean('TRUST_PROXY', environment.TRUST_PROXY),
    ledgerOutboxWorker: {
      enabled: parseBoolean(
        'LEDGER_OUTBOX_WORKER_ENABLED',
        environment.LEDGER_OUTBOX_WORKER_ENABLED,
      ),
      intervalMs: parsePositiveInteger(
        'LEDGER_OUTBOX_INTERVAL_MS',
        environment.LEDGER_OUTBOX_INTERVAL_MS,
        1_000,
      ),
      batchSize: parsePositiveInteger(
        'LEDGER_OUTBOX_BATCH_SIZE',
        environment.LEDGER_OUTBOX_BATCH_SIZE,
        50,
      ),
      leaseMs: parsePositiveInteger(
        'LEDGER_OUTBOX_LEASE_MS',
        environment.LEDGER_OUTBOX_LEASE_MS,
        30_000,
      ),
      maxAttempts: parsePositiveInteger(
        'LEDGER_OUTBOX_MAX_ATTEMPTS',
        environment.LEDGER_OUTBOX_MAX_ATTEMPTS,
        10,
      ),
      baseRetryDelayMs: parsePositiveInteger(
        'LEDGER_OUTBOX_BASE_RETRY_DELAY_MS',
        environment.LEDGER_OUTBOX_BASE_RETRY_DELAY_MS,
        1_000,
      ),
      maxRetryDelayMs: parsePositiveInteger(
        'LEDGER_OUTBOX_MAX_RETRY_DELAY_MS',
        environment.LEDGER_OUTBOX_MAX_RETRY_DELAY_MS,
        60_000,
      ),
      jitterRatio: parseRatio(
        'LEDGER_OUTBOX_JITTER_RATIO',
        environment.LEDGER_OUTBOX_JITTER_RATIO,
        0.2,
      ),
    },
  };
}
