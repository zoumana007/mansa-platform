import assert from 'node:assert/strict';
import test from 'node:test';

import { createNavigationSemantics } from '../dist/index.js';

test('normalise une navigation principale et son élément courant', () => {
  assert.deepEqual(
    createNavigationSemantics({
      id: '  main-nav  ',
      label: '  Navigation principale  ',
      items: [
        { id: 'home', label: 'Accueil', href: '/home', current: true },
        { id: 'wallet', label: 'Portefeuille', href: '/wallet' },
      ],
    }),
    {
      id: 'main-nav',
      label: 'Navigation principale',
      kind: 'primary',
      role: 'navigation',
      items: [
        {
          id: 'home',
          label: 'Accueil',
          href: '/home',
          current: true,
          disabled: false,
          focusable: true,
          ariaCurrent: 'page',
        },
        {
          id: 'wallet',
          label: 'Portefeuille',
          href: '/wallet',
          current: false,
          disabled: false,
          focusable: true,
        },
      ],
      currentItemId: 'home',
    },
  );
});

test('mappe une navigation onglets vers tablist', () => {
  const navigation = createNavigationSemantics({
    id: 'profile-tabs',
    label: 'Sections du profil',
    kind: 'tabs',
    items: [
      { id: 'identity', label: 'Identité' },
      { id: 'security', label: 'Sécurité', current: true },
    ],
  });

  assert.equal(navigation.role, 'tablist');
  assert.equal(navigation.currentItemId, 'security');
});

test('rend un élément désactivé non focalisable', () => {
  const navigation = createNavigationSemantics({
    id: 'secondary',
    label: 'Navigation secondaire',
    items: [{ id: 'future', label: 'Bientôt disponible', disabled: true }],
  });

  assert.equal(navigation.items[0].disabled, true);
  assert.equal(navigation.items[0].focusable, false);
});

test('refuse plusieurs éléments courants', () => {
  assert.throws(
    () =>
      createNavigationSemantics({
        id: 'nav',
        label: 'Navigation',
        items: [
          { id: 'one', label: 'Un', current: true },
          { id: 'two', label: 'Deux', current: true },
        ],
      }),
    /only one current item/,
  );
});

test('refuse un élément courant désactivé et les doublons', () => {
  assert.throws(
    () =>
      createNavigationSemantics({
        id: 'nav',
        label: 'Navigation',
        items: [{ id: 'one', label: 'Un', current: true, disabled: true }],
      }),
    /cannot be disabled/,
  );

  assert.throws(
    () =>
      createNavigationSemantics({
        id: 'nav',
        label: 'Navigation',
        items: [
          { id: 'same', label: 'Un' },
          { id: 'same', label: 'Deux' },
        ],
      }),
    /duplicate navigation item id/,
  );
});

test('refuse une navigation vide ou des champs obligatoires vides', () => {
  assert.throws(
    () => createNavigationSemantics({ id: 'nav', label: 'Navigation', items: [] }),
    /at least one item/,
  );
  assert.throws(
    () => createNavigationSemantics({ id: ' ', label: 'Navigation', items: [{ id: 'a', label: 'A' }] }),
    /navigation id/,
  );
  assert.throws(
    () => createNavigationSemantics({ id: 'nav', label: ' ', items: [{ id: 'a', label: 'A' }] }),
    /navigation label/,
  );
});
