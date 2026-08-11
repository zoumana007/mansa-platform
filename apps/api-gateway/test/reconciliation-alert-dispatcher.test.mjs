import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationAlertDispatcher } from '../dist/reconciliation/reconciliation-alert-dispatcher.js';
import { ReconciliationAlertingPolicy } from '../dist/reconciliation/reconciliation-alerting-policy.js';

const T0 = Date.parse('2026-08-11T00:00:00.000Z');

const evaluation = (status, breaches = []) => ({
  status,
  sli: {
    completedImports: 10,
    importFailureRate: status === 'CRITICAL' ? 0.2 : 0,
    comparedItems: 100,
    mismatchRate: status === 'WARNING' ? 0.01 : 0,
    lastImportDurationMs: 100,
  },
  breaches,
});

class RecordingSink {
  constructor() {
    this.payloads = [];
  }

  async send(payload) {
    this.payloads.push(payload);
  }
}

test('dispatcher stays silent when policy decides no notification', async () => {
  const sink = new RecordingSink();
  const dispatcher = new ReconciliationAlertDispatcher(new ReconciliationAlertingPolicy(), sink);

  const result = await dispatcher.dispatch(evaluation('NO_DATA'), T0);

  assert.equal(result.delivered, false);
  assert.equal(result.decision.shouldNotify, false);
  assert.equal(sink.payloads.length, 0);
});

test('dispatcher delivers warning with bounded SLI and breach context', async () => {
  const sink = new RecordingSink();
  const dispatcher = new ReconciliationAlertDispatcher(new ReconciliationAlertingPolicy(), sink);
  const breaches = [
    {
      indicator: 'MISMATCH_RATE',
      severity: 'WARNING',
      observed: 0.01,
      threshold: 0.005,
    },
  ];

  const result = await dispatcher.dispatch(evaluation('WARNING', breaches), T0);

  assert.equal(result.delivered, true);
  assert.equal(result.decision.event, 'WARNING');
  assert.equal(sink.payloads.length, 1);
  assert.deepEqual(sink.payloads[0], {
    event: 'WARNING',
    status: 'WARNING',
    evaluatedAt: new Date(T0).toISOString(),
    previousStatus: null,
    breaches,
    sli: evaluation('WARNING').sli,
  });
});

test('dispatcher does not redeliver during cooldown and emits recovery', async () => {
  const sink = new RecordingSink();
  const dispatcher = new ReconciliationAlertDispatcher(new ReconciliationAlertingPolicy(), sink);

  const first = await dispatcher.dispatch(evaluation('CRITICAL'), T0);
  const duplicate = await dispatcher.dispatch(evaluation('CRITICAL'), T0 + 1_000);
  const recovered = await dispatcher.dispatch(evaluation('HEALTHY'), T0 + 2_000);

  assert.equal(first.delivered, true);
  assert.equal(duplicate.delivered, false);
  assert.equal(recovered.delivered, true);
  assert.deepEqual(
    sink.payloads.map((payload) => payload.event),
    ['CRITICAL', 'RECOVERED'],
  );
});

test('dispatcher propagates sink delivery failures instead of reporting success', async () => {
  const failingSink = {
    async send() {
      throw new Error('sink unavailable');
    },
  };
  const dispatcher = new ReconciliationAlertDispatcher(
    new ReconciliationAlertingPolicy(),
    failingSink,
  );

  await assert.rejects(() => dispatcher.dispatch(evaluation('WARNING'), T0), /sink unavailable/);
});
