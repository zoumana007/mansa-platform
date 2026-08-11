export const spacing = Object.freeze({
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  display: 64,
} as const);

export const radii = Object.freeze({
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const);

export const typography = Object.freeze({
  fontSize: Object.freeze({
    caption: 12,
    bodySmall: 14,
    body: 16,
    titleSmall: 18,
    title: 22,
    heading: 28,
    display: 36,
  }),
  lineHeight: Object.freeze({
    caption: 16,
    bodySmall: 20,
    body: 24,
    titleSmall: 24,
    title: 28,
    heading: 36,
    display: 44,
  }),
  fontWeight: Object.freeze({
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }),
} as const);

export const controlSize = Object.freeze({
  compact: 36,
  default: 44,
  large: 52,
  minimumTouchTarget: 44,
} as const);

export const motion = Object.freeze({
  durationMs: Object.freeze({
    instant: 0,
    fast: 120,
    normal: 200,
    slow: 320,
  }),
} as const);

export interface SemanticPaletteInput {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly text: string;
  readonly textMuted: string;
  readonly border: string;
  readonly primary: string;
  readonly onPrimary: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
}

export interface MansaUiTheme {
  readonly colors: Readonly<SemanticPaletteInput>;
  readonly spacing: typeof spacing;
  readonly radii: typeof radii;
  readonly typography: typeof typography;
  readonly controlSize: typeof controlSize;
  readonly motion: typeof motion;
}

function normalizeColorToken(name: keyof SemanticPaletteInput, value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`missing required semantic color token: ${name}`);
  return normalized;
}

export function createUiTheme(palette: SemanticPaletteInput): MansaUiTheme {
  const colors = Object.freeze({
    background: normalizeColorToken('background', palette.background),
    surface: normalizeColorToken('surface', palette.surface),
    surfaceRaised: normalizeColorToken('surfaceRaised', palette.surfaceRaised),
    text: normalizeColorToken('text', palette.text),
    textMuted: normalizeColorToken('textMuted', palette.textMuted),
    border: normalizeColorToken('border', palette.border),
    primary: normalizeColorToken('primary', palette.primary),
    onPrimary: normalizeColorToken('onPrimary', palette.onPrimary),
    success: normalizeColorToken('success', palette.success),
    warning: normalizeColorToken('warning', palette.warning),
    danger: normalizeColorToken('danger', palette.danger),
  });

  return Object.freeze({
    colors,
    spacing,
    radii,
    typography,
    controlSize,
    motion,
  });
}

export {
  accessibility,
  createControlSemantics,
  focusRing,
  interactionOpacity,
} from './interaction.js';
export type {
  ControlEmphasis,
  ControlIntent,
  ControlSemantics,
  ControlSemanticsInput,
  ControlState,
} from './interaction.js';
export { createFieldSemantics } from './form.js';
export type { FieldSemantics, FieldSemanticsInput, FieldStatus } from './form.js';
