import assert from 'node:assert/strict';
import test from 'node:test';

import { createProgressSemantics } from '../dist/index.js';

test('normalise une progression déterminée', () => {
  assert.deepEqual(
    createProgressSemantics({
      id: '  upload  ',
      label: '  Import du document  ',
      state: 'running',
      value: 40,
    }),
    {
      id: 'upload',
      label: 'Import du document',
      state: 'running',
      role: 'progressbar',
      live: 'off',
      min: 0,
      max: 100,
      value: 40,
      indeterminate: false,
      complete: false,
      failed: false,
    },
  );
});

test('gère une progression indéterminée sans valeur', () => {
  const progress = createProgressSemantics({
    id: 'sync',
    label: 'Synchronisation',
    state: 'running',
  });

  assert.equal(progress.indeterminate, true);
  assert.equal('value' in progress, false);
  assert.equal(progress.live, 'off');
});

test('annonce poliment la réussite et assertivement l’erreur', () => {
  assert.equal(
    createProgressSemantics({
      id: 'complete',
      label: 'Import terminé',
      state: 'success',
      value: 100,
    }).live,
    'polite',
  );
  assert.equal(
    createProgressSemantics({
      id: 'failed',
      label: 'Import impossible',
      state: 'error',
      indeterminate: true,
    }).live,
    'assertive',
  );
});

test('refuse une plage invalide et une valeur hors bornes', () => {
  assert.throws(
    () => createProgressSemantics({ id: 'p', label: 'Progression', min: 10, max: 10 }),
    /max must be greater than min/,
  );
  assert.throws(
    () => createProgressSemantics({ id: 'p', label: 'Progression', value: 101 }),
    /within min and max/,
  );
});

test('refuse les combinaisons incohérentes déterminées et indéterminées', () => {
  assert.throws(
    () =>
      createProgressSemantics({
        id: 'p',
        label: 'Progression',
        value: 10,
        indeterminate: true,
      }),
    /indeterminate progress cannot define a value/,
  );
  assert.throws(
    () => createProgressSemantics({ id: 'p', label: 'Progression', indeterminate: false }),
    /determinate progress requires a value/,
  );
});

test('refuse identifiant et libellé vides', () => {
  assert.throws(() => createProgressSemantics({ id: ' ', label: 'Progression' }), /progress id/);
  assert.throws(() => createProgressSemantics({ id: 'p', label: ' ' }), /progress label/);
});
