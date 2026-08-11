import assert from 'node:assert/strict';
import test from 'node:test';

import {
  controlSize,
  createUiTheme,
  motion,
  radii,
  spacing,
  typography,
} from '../dist/index.js';

const palette = {
  background: '#FFFFFF',
  surface: '#F8F8F8',
  surfaceRaised: '#FFFFFF',
  text: '#111111',
  textMuted: '#666666',
  border: '#DDDDDD',
  primary: '#111111',
  onPrimary: '#FFFFFF',
  success: '#157347',
  warning: '#A15C00',
  danger: '#B42318',
};

test('shared foundation tokens stay immutable', () => {
  assert.equal(Object.isFrozen(spacing), true);
  assert.equal(Object.isFrozen(radii), true);
  assert.equal(Object.isFrozen(typography), true);
  assert.equal(Object.isFrozen(typography.fontSize), true);
  assert.equal(Object.isFrozen(typography.lineHeight), true);
  assert.equal(Object.isFrozen(typography.fontWeight), true);
  assert.equal(Object.isFrozen(controlSize), true);
  assert.equal(Object.isFrozen(motion), true);
  assert.equal(Object.isFrozen(motion.durationMs), true);
});

test('minimum touch target remains 44 logical pixels', () => {
  assert.equal(controlSize.minimumTouchTarget, 44);
  assert.ok(controlSize.default >= controlSize.minimumTouchTarget);
  assert.ok(controlSize.large >= controlSize.minimumTouchTarget);
});

test('createUiTheme trims colors and returns an immutable theme', () => {
  const theme = createUiTheme({ ...palette, primary: '  #111111  ' });

  assert.equal(theme.colors.primary, '#111111');
  assert.equal(theme.spacing, spacing);
  assert.equal(theme.radii, radii);
  assert.equal(theme.typography, typography);
  assert.equal(Object.isFrozen(theme), true);
  assert.equal(Object.isFrozen(theme.colors), true);
});

test('createUiTheme fails closed when a semantic color is empty', () => {
  assert.throws(
    () => createUiTheme({ ...palette, danger: '   ' }),
    /missing required semantic color token: danger/,
  );
});
