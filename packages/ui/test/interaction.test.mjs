import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accessibility,
  createControlSemantics,
  focusRing,
  interactionOpacity,
} from '../dist/index.js';

test('expose des constantes cross-platform stables', () => {
  assert.equal(accessibility.minimumTouchTarget, 44);
  assert.equal(focusRing.width, 2);
  assert.equal(interactionOpacity.disabled, 0.48);
});

test('normalise les contrôles interactifs', () => {
  assert.deepEqual(createControlSemantics({ accessibleName: '  Continuer  ' }), {
    accessibleName: 'Continuer',
    intent: 'neutral',
    emphasis: 'solid',
    state: 'idle',
    destructive: false,
    interactive: true,
    requiresConfirmation: false,
  });
});

test('rend disabled et loading non interactifs', () => {
  assert.equal(
    createControlSemantics({ accessibleName: 'Envoyer', state: 'disabled' }).interactive,
    false,
  );
  assert.equal(
    createControlSemantics({ accessibleName: 'Envoyer', state: 'loading' }).interactive,
    false,
  );
});

test('force danger et confirmation pour les actions destructives', () => {
  const destructive = createControlSemantics({
    accessibleName: 'Supprimer le compte',
    destructive: true,
  });
  assert.equal(destructive.intent, 'danger');
  assert.equal(destructive.requiresConfirmation, true);
  assert.throws(
    () =>
      createControlSemantics({
        accessibleName: 'Supprimer',
        destructive: true,
        intent: 'primary',
      }),
    /danger intent/,
  );
});

test('refuse un contrôle sans nom accessible', () => {
  assert.throws(
    () => createControlSemantics({ accessibleName: '   ' }),
    /non-empty accessible name/,
  );
});
