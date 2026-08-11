export type MansaEnvironment = 'demo' | 'staging' | 'production';

export interface RuntimeConfigInput {
  readonly environment?: string;
  readonly countryCode?: string;
  readonly currency?: string;
  readonly apiBaseUrl?: string;
  readonly logLevel?: string;
}

export interface MansaRuntimeConfig {
  readonly environment: MansaEnvironment;
  readonly countryCode: string;
  readonly currency: string;
  readonly apiBaseUrl: string;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const ENVIRONMENTS = new Set<MansaEnvironment>(['demo', 'staging', 'production']);
const LOG_LEVELS = new Set<MansaRuntimeConfig['logLevel']>([
  'debug',
  'info',
  'warn',
  'error',
]);

function required(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`missing required runtime configuration: ${name}`);
  return normalized;
}

function normalizeEnvironment(value: string | undefined): MansaEnvironment {
  const normalized = required('environment', value).toLowerCase();
  if (!ENVIRONMENTS.has(normalized as MansaEnvironment)) {
    throw new Error(`unsupported Mansa environment: ${normalized}`);
  }
  return normalized as MansaEnvironment;
}

function normalizeCountryCode(value: string | undefined): string {
  const normalized = required('countryCode', value).toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error('countryCode must be an ISO 3166-1 alpha-2 code');
  }
  return normalized;
}

function normalizeCurrency(value: string | undefined): string {
  const normalized = required('currency', value).toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error('currency must be an ISO 4217 alpha-3 code');
  }
  return normalized;
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = required('apiBaseUrl', value);
  const url = new URL(normalized);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('apiBaseUrl must use HTTPS outside local development');
  }
  return url.toString().replace(/\/$/, '');
}

function normalizeLogLevel(value: string | undefined): MansaRuntimeConfig['logLevel'] {
  const normalized = (value?.trim().toLowerCase() || 'info') as MansaRuntimeConfig['logLevel'];
  if (!LOG_LEVELS.has(normalized)) throw new Error(`unsupported log level: ${normalized}`);
  return normalized;
}

export function parseRuntimeConfig(input: RuntimeConfigInput): MansaRuntimeConfig {
  return Object.freeze({
    environment: normalizeEnvironment(input.environment),
    countryCode: normalizeCountryCode(input.countryCode),
    currency: normalizeCurrency(input.currency),
    apiBaseUrl: normalizeApiBaseUrl(input.apiBaseUrl),
    logLevel: normalizeLogLevel(input.logLevel),
  });
}
