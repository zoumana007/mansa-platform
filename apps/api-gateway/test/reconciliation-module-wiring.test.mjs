import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const moduleSource = readFileSync(
  new URL('../src/reconciliation/reconciliation.module.ts', import.meta.url),
  'utf8',
);

function extractModuleSection(name, nextName) {
  const startMarker = `${name}: [`;
  const start = moduleSource.indexOf(startMarker);
  assert.notEqual(start, -1, `ReconciliationModule must declare ${name}`);

  const endMarker = nextName ? `\n  ${nextName}: [` : '\n})';
  const end = moduleSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `ReconciliationModule ${name} section must be bounded`);

  return moduleSource.slice(start, end);
}

test('ReconciliationModule wires quarantine persistence guard and decision service as providers', () => {
  const providers = extractModuleSection('providers', 'exports');

  assert.match(providers, /\bReconciliationQuarantinePolicyRegistry\b/);
  assert.match(providers, /\bReconciliationQuarantinePersistencePolicy\b/);
  assert.match(providers, /\bReconciliationQuarantineDecisionService\b/);
});

test('ReconciliationModule exports quarantine persistence guard and decision service', () => {
  const exportsSection = extractModuleSection('exports');

  assert.match(exportsSection, /\bReconciliationQuarantinePolicyRegistry\b/);
  assert.match(exportsSection, /\bReconciliationQuarantinePersistencePolicy\b/);
  assert.match(exportsSection, /\bReconciliationQuarantineDecisionService\b/);
});

test('quarantine decision service keeps its persistence guard injected instead of constructing it privately', () => {
  const decisionServiceSource = readFileSync(
    new URL(
      '../src/reconciliation/reconciliation-quarantine-decision.service.ts',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(
    decisionServiceSource,
    /private readonly persistencePolicy:\s*ReconciliationQuarantinePersistencePolicy/,
  );
  assert.doesNotMatch(
    decisionServiceSource,
    /private readonly persistencePolicy\s*=\s*new ReconciliationQuarantinePersistencePolicy/,
  );
});
