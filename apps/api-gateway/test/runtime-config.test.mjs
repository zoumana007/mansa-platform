import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadRuntimeConfig } = require('../dist/runtime-config.js');

const defaultOutbox = {
  enabled: false,
  intervalMs: 1_000,
  batchSize: 50,
  leaseMs: 30_000,
  maxAttempts: 10,
  baseRetryDelayMs: 1_000,
  maxRetryDelayMs: 60_000,
  jitterRatio: 0.2,
};

test('utilise des valeurs locales sûres par défaut', () => {
  assert.deepEqual(loadRuntimeConfig({}), {
    environment: 'development',
    host: '0.0.0.0',
    port: 3000,
    trustProxy: false,
    ledgerOutboxWorker: defaultOutbox,
  });
});

test('accepte une configuration valide', () => {
  assert.deepEqual(
    loadRuntimeConfig({
      NODE_ENV: 'staging',
      HOST: '127.0.0.1',
      PORT: '4100',
      TRUST_PROXY: 'true',
      LEDGER_OUTBOX_WORKER_ENABLED: 'true',
      LEDGER_OUTBOX_INTERVAL_MS: '1500',
      LEDGER_OUTBOX_BATCH_SIZE: '75',
      LEDGER_OUTBOX_LEASE_MS: '45000',
      LEDGER_OUTBOX_MAX_ATTEMPTS: '12',
      LEDGER_OUTBOX_BASE_RETRY_DELAY_MS: '2000',
      LEDGER_OUTBOX_MAX_RETRY_DELAY_MS: '90000',
      LEDGER_OUTBOX_JITTER_RATIO: '0.15',
    }),
    {
      environment: 'staging',
      host: '127.0.0.1',
      port: 4100,
      trustProxy: true,
      ledgerOutboxWorker: {
        enabled: true,
        intervalMs: 1500,
        batchSize: 75,
        leaseMs: 45000,
        maxAttempts: 12,
        baseRetryDelayMs: 2000,
        maxRetryDelayMs: 90000,
        jitterRatio: 0.15,
      },
    },
  );
});

test('refuse un port partiellement numérique', () => {
  assert.throws(
    () => loadRuntimeConfig({ PORT: '3000abc' }),
    /PORT must be an integer between 1 and 65535/,
  );
});

test('refuse un environnement inconnu', () => {
  assert.throws(
    () => loadRuntimeConfig({ NODE_ENV: 'preview' }),
    /NODE_ENV must be one of development, test, staging or production/,
  );
});

test('refuse une valeur booléenne ambiguë', () => {
  assert.throws(
    () => loadRuntimeConfig({ TRUST_PROXY: '1' }),
    /TRUST_PROXY must be either true or false/,
  );
});

test('refuse une configuration outbox invalide', () => {
  assert.throws(
    () => loadRuntimeConfig({ LEDGER_OUTBOX_BATCH_SIZE: '0' }),
    /LEDGER_OUTBOX_BATCH_SIZE must be a positive integer/,
  );
  assert.throws(
    () => loadRuntimeConfig({ LEDGER_OUTBOX_JITTER_RATIO: '1.5' }),
    /LEDGER_OUTBOX_JITTER_RATIO must be a number between 0 and 1/,
  );
});
