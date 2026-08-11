export type ControlIntent = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export type ControlEmphasis = 'subtle' | 'solid' | 'outline';
export type ControlState = 'idle' | 'pressed' | 'disabled' | 'loading';

export interface ControlSemanticsInput {
  readonly accessibleName: string;
  readonly intent?: ControlIntent;
  readonly emphasis?: ControlEmphasis;
  readonly state?: ControlState;
  readonly destructive?: boolean;
}

export interface ControlSemantics {
  readonly accessibleName: string;
  readonly intent: ControlIntent;
  readonly emphasis: ControlEmphasis;
  readonly state: ControlState;
  readonly destructive: boolean;
  readonly interactive: boolean;
  readonly requiresConfirmation: boolean;
}

export const interactionOpacity = Object.freeze({
  idle: 1,
  pressed: 0.92,
  disabled: 0.48,
  loading: 0.72,
} as const);

export const focusRing = Object.freeze({
  width: 2,
  offset: 2,
} as const);

export const accessibility = Object.freeze({
  minimumTouchTarget: 44,
  minimumAccessibleNameLength: 1,
} as const);

function normalizeAccessibleName(value: string): string {
  const normalized = value.trim();
  if (normalized.length < accessibility.minimumAccessibleNameLength) {
    throw new Error('interactive control requires a non-empty accessible name');
  }
  return normalized;
}

export function createControlSemantics(input: ControlSemanticsInput): ControlSemantics {
  const state = input.state ?? 'idle';
  const destructive = input.destructive ?? false;
  const intent = input.intent ?? (destructive ? 'danger' : 'neutral');
  const emphasis = input.emphasis ?? 'solid';

  if (destructive && intent !== 'danger') {
    throw new Error('destructive controls must use danger intent');
  }

  return Object.freeze({
    accessibleName: normalizeAccessibleName(input.accessibleName),
    intent,
    emphasis,
    state,
    destructive,
    interactive: state !== 'disabled' && state !== 'loading',
    requiresConfirmation: destructive,
  });
}
