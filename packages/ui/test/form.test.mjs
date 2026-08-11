import assert from 'node:assert/strict';
import test from 'node:test';

import { createFieldSemantics } from '../dist/index.js';

test('normalise un champ accessible', () => {
  assert.deepEqual(
    createFieldSemantics({
      id: '  phone  ',
      label: '  Numéro de téléphone  ',
      description: '  Format international  ',
      required: true,
    }),
    {
      id: 'phone',
      label: 'Numéro de téléphone',
      description: 'Format international',
      required: true,
      disabled: false,
      readOnly: false,
      interactive: true,
      status: 'default',
      describedBy: ['phone-description'],
    },
  );
});

test('priorise le statut erreur et référence les messages', () => {
  const field = createFieldSemantics({
    id: 'amount',
    label: 'Montant',
    description: 'En FCFA',
    errorMessage: 'Montant invalide',
  });

  assert.equal(field.status, 'error');
  assert.deepEqual(field.describedBy, ['amount-description', 'amount-error']);
});

test('rend les champs disabled et read-only non interactifs', () => {
  assert.equal(
    createFieldSemantics({ id: 'a', label: 'A', disabled: true }).interactive,
    false,
  );
  assert.equal(
    createFieldSemantics({ id: 'b', label: 'B', readOnly: true }).interactive,
    false,
  );
});

test('refuse un champ à la fois disabled et read-only', () => {
  assert.throws(
    () => createFieldSemantics({ id: 'a', label: 'A', disabled: true, readOnly: true }),
    /both disabled and read-only/,
  );
});

test('refuse les identifiants et labels vides', () => {
  assert.throws(() => createFieldSemantics({ id: ' ', label: 'Nom' }), /field id/);
  assert.throws(() => createFieldSemantics({ id: 'name', label: ' ' }), /field label/);
});
