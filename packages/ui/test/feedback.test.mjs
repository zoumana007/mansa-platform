import assert from 'node:assert/strict';
import test from 'node:test';

import { createFeedbackSemantics } from '../dist/index.js';

test('normalise un feedback informatif non urgent', () => {
  assert.deepEqual(
    createFeedbackSemantics({
      id: '  sync-ok  ',
      title: '  Synchronisation  ',
      message: '  Données à jour  ',
    }),
    {
      id: 'sync-ok',
      title: 'Synchronisation',
      message: 'Données à jour',
      tone: 'info',
      role: 'status',
      live: 'polite',
      persistent: false,
      dismissible: true,
      requiresExplicitAttention: false,
    },
  );
});

test('rend une erreur assertive et persistante par défaut', () => {
  const feedback = createFeedbackSemantics({
    id: 'payment-error',
    message: 'Paiement refusé',
    tone: 'error',
  });

  assert.equal(feedback.role, 'alert');
  assert.equal(feedback.live, 'assertive');
  assert.equal(feedback.persistent, true);
  assert.equal(feedback.dismissible, false);
  assert.equal(feedback.requiresExplicitAttention, true);
});

test('conserve warning et success en annonce polie', () => {
  assert.equal(
    createFeedbackSemantics({ id: 'warning', message: 'Connexion instable', tone: 'warning' }).live,
    'polite',
  );
  assert.equal(
    createFeedbackSemantics({ id: 'success', message: 'Virement envoyé', tone: 'success' }).role,
    'status',
  );
});

test('refuse un feedback persistant explicitement dismissible', () => {
  assert.throws(
    () =>
      createFeedbackSemantics({
        id: 'critical',
        message: 'Action requise',
        persistent: true,
        dismissible: true,
      }),
    /persistent feedback cannot be dismissible/,
  );
});

test('refuse identifiant et message vides', () => {
  assert.throws(() => createFeedbackSemantics({ id: ' ', message: 'Erreur' }), /feedback id/);
  assert.throws(() => createFeedbackSemantics({ id: 'error', message: ' ' }), /feedback message/);
});
