import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import { InternalServiceGuard } from '../dist/internal-service.guard.js';

const makeContext = (headers = {}) => ({
  switchToHttp() {
    return {
      getRequest() {
        return { headers };
      },
    };
  },
});

const withInternalToken = async (token, callback) => {
  const previous = process.env.INTERNAL_SERVICE_TOKEN;
  if (token === undefined) {
    delete process.env.INTERNAL_SERVICE_TOKEN;
  } else {
    process.env.INTERNAL_SERVICE_TOKEN = token;
  }

  try {
    await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.INTERNAL_SERVICE_TOKEN;
    } else {
      process.env.INTERNAL_SERVICE_TOKEN = previous;
    }
  }
};

test('fails closed when internal service authentication is not configured', async () => {
  await withInternalToken(undefined, () => {
    const guard = new InternalServiceGuard();

    assert.throws(
      () => guard.canActivate(makeContext()),
      (error) =>
        error instanceof ServiceUnavailableException &&
        error.message === 'Internal service authentication is not configured.',
    );
  });
});

test('fails closed when the configured token is shorter than 32 characters', async () => {
  await withInternalToken('too-short', () => {
    const guard = new InternalServiceGuard();

    assert.throws(
      () => guard.canActivate(makeContext()),
      ServiceUnavailableException,
    );
  });
});

test('rejects a request without the internal token header', async () => {
  const expected = '0123456789abcdef0123456789abcdef';

  await withInternalToken(expected, () => {
    const guard = new InternalServiceGuard();

    assert.throws(
      () => guard.canActivate(makeContext()),
      UnauthorizedException,
    );
  });
});

test('rejects an invalid internal token', async () => {
  const expected = '0123456789abcdef0123456789abcdef';
  const received = 'fedcba9876543210fedcba9876543210';

  await withInternalToken(expected, () => {
    const guard = new InternalServiceGuard();

    assert.throws(
      () =>
        guard.canActivate(
          makeContext({ 'x-mansa-internal-token': received }),
        ),
      UnauthorizedException,
    );
  });
});

test('accepts an exact internal token match', async () => {
  const expected = '0123456789abcdef0123456789abcdef';

  await withInternalToken(expected, () => {
    const guard = new InternalServiceGuard();

    assert.equal(
      guard.canActivate(
        makeContext({ 'x-mansa-internal-token': expected }),
      ),
      true,
    );
  });
});

test('accepts the first header value when the runtime exposes an array', async () => {
  const expected = '0123456789abcdef0123456789abcdef';

  await withInternalToken(expected, () => {
    const guard = new InternalServiceGuard();

    assert.equal(
      guard.canActivate(
        makeContext({
          'x-mansa-internal-token': [expected, 'ignored-value'],
        }),
      ),
      true,
    );
  });
});
