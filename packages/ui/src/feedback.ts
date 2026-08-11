export type FeedbackTone = 'info' | 'success' | 'warning' | 'error';
export type FeedbackPoliteness = 'polite' | 'assertive';

export interface FeedbackSemanticsInput {
  readonly id: string;
  readonly title?: string;
  readonly message: string;
  readonly tone?: FeedbackTone;
  readonly persistent?: boolean;
  readonly dismissible?: boolean;
}

export interface FeedbackSemantics {
  readonly id: string;
  readonly title?: string;
  readonly message: string;
  readonly tone: FeedbackTone;
  readonly role: 'status' | 'alert';
  readonly live: FeedbackPoliteness;
  readonly persistent: boolean;
  readonly dismissible: boolean;
  readonly requiresExplicitAttention: boolean;
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

export function createFeedbackSemantics(input: FeedbackSemanticsInput): FeedbackSemantics {
  const id = normalizeRequiredText('feedback id', input.id);
  const message = normalizeRequiredText('feedback message', input.message);
  const title = normalizeOptionalText(input.title);
  const tone = input.tone ?? 'info';
  const persistent = input.persistent ?? tone === 'error';
  const dismissible = input.dismissible ?? !persistent;
  const urgent = tone === 'error';

  if (persistent && dismissible) {
    throw new Error('persistent feedback cannot be dismissible by default semantics');
  }

  return Object.freeze({
    id,
    ...(title ? { title } : {}),
    message,
    tone,
    role: urgent ? 'alert' : 'status',
    live: urgent ? 'assertive' : 'polite',
    persistent,
    dismissible,
    requiresExplicitAttention: urgent || persistent,
  });
}
