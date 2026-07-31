import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadRuntimeConfig } = require('../dist/runtime-config.js');

test('utilise des valeurs locales sûres par défaut', () => {
  assert.deepEqual(loadRuntimeConfig({}), {
    environment: 'development',
    host: '0.0.0.0',
    port: 3000,
    trustProxy: false,
  });
});

test('accepte une configuration valide', () => {
  assert.deepEqual(
    loadRuntimeConfig({
      NODE_ENV: 'staging',
      HOST: '127.0.0.1',
      PORT: '4100',
      TRUST_PROXY: 'true',
    }),
    {
      environment: 'staging',
      host: '127.0.0.1',
      port: 4100,
      trustProxy: true,
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
