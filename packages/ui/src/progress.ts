export type ProgressState = 'idle' | 'running' | 'success' | 'error';

export interface ProgressSemanticsInput {
  readonly id: string;
  readonly label: string;
  readonly state?: ProgressState;
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
  readonly indeterminate?: boolean;
}

export interface ProgressSemantics {
  readonly id: string;
  readonly label: string;
  readonly state: ProgressState;
  readonly role: 'progressbar';
  readonly live: 'off' | 'polite' | 'assertive';
  readonly min: number;
  readonly max: number;
  readonly value?: number;
  readonly indeterminate: boolean;
  readonly complete: boolean;
  readonly failed: boolean;
}

function normalizeRequiredText(name: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must be non-empty`);
  return normalized;
}

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
}

export function createProgressSemantics(input: ProgressSemanticsInput): ProgressSemantics {
  const id = normalizeRequiredText('progress id', input.id);
  const label = normalizeRequiredText('progress label', input.label);
  const state = input.state ?? 'idle';
  const min = input.min ?? 0;
  const max = input.max ?? 100;
  const indeterminate = input.indeterminate ?? input.value === undefined;

  assertFinite('progress min', min);
  assertFinite('progress max', max);
  if (max <= min) throw new Error('progress max must be greater than min');

  if (indeterminate && input.value !== undefined) {
    throw new Error('indeterminate progress cannot define a value');
  }

  let value: number | undefined;
  if (!indeterminate) {
    if (input.value === undefined) throw new Error('determinate progress requires a value');
    assertFinite('progress value', input.value);
    if (input.value < min || input.value > max) {
      throw new Error('progress value must be within min and max');
    }
    value = input.value;
  }

  const complete = state === 'success';
  const failed = state === 'error';
  const live = failed ? 'assertive' : complete ? 'polite' : 'off';

  return Object.freeze({
    id,
    label,
    state,
    role: 'progressbar',
    live,
    min,
    max,
    ...(value !== undefined ? { value } : {}),
    indeterminate,
    complete,
    failed,
  });
}
