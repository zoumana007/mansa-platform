export type FieldStatus = 'default' | 'success' | 'warning' | 'error';

export interface FieldSemanticsInput {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
}

export interface FieldSemantics {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly errorMessage?: string;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly interactive: boolean;
  readonly status: FieldStatus;
  readonly describedBy: readonly string[];
}

function normalizeRequiredText(name: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must be non-empty`);
  return normalized;
}

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function createFieldSemantics(input: FieldSemanticsInput): FieldSemantics {
  const id = normalizeRequiredText('field id', input.id);
  const label = normalizeRequiredText('field label', input.label);
  const description = normalizeOptionalText(input.description);
  const errorMessage = normalizeOptionalText(input.errorMessage);
  const disabled = input.disabled ?? false;
  const readOnly = input.readOnly ?? false;

  if (disabled && readOnly) {
    throw new Error('a field cannot be both disabled and read-only');
  }

  const describedBy = Object.freeze([
    ...(description ? [`${id}-description`] : []),
    ...(errorMessage ? [`${id}-error`] : []),
  ]);

  return Object.freeze({
    id,
    label,
    ...(description ? { description } : {}),
    ...(errorMessage ? { errorMessage } : {}),
    required: input.required ?? false,
    disabled,
    readOnly,
    interactive: !disabled && !readOnly,
    status: errorMessage ? 'error' : 'default',
    describedBy,
  });
}
