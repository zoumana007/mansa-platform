export type RuntimeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  host: string;
  port: number;
  trustProxy: boolean;
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

export function loadRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const host = environment.HOST?.trim() || DEFAULT_HOST;

  return {
    environment: parseEnvironment(environment.NODE_ENV),
    host,
    port: parsePort(environment.PORT),
    trustProxy: parseBoolean('TRUST_PROXY', environment.TRUST_PROXY),
  };
}
