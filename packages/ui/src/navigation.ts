export type NavigationKind = 'primary' | 'secondary' | 'breadcrumb' | 'tabs';

export interface NavigationItemInput {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
  readonly disabled?: boolean;
}

export interface NavigationItemSemantics {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly current: boolean;
  readonly disabled: boolean;
  readonly focusable: boolean;
  readonly ariaCurrent?: 'page';
}

export interface NavigationSemanticsInput {
  readonly id: string;
  readonly label: string;
  readonly kind?: NavigationKind;
  readonly items: readonly NavigationItemInput[];
}

export interface NavigationSemantics {
  readonly id: string;
  readonly label: string;
  readonly kind: NavigationKind;
  readonly role: 'navigation' | 'tablist';
  readonly items: readonly NavigationItemSemantics[];
  readonly currentItemId?: string;
}

function normalizeRequiredText(name: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must be non-empty`);
  return normalized;
}

export function createNavigationSemantics(input: NavigationSemanticsInput): NavigationSemantics {
  const id = normalizeRequiredText('navigation id', input.id);
  const label = normalizeRequiredText('navigation label', input.label);
  const kind = input.kind ?? 'primary';

  if (input.items.length === 0) throw new Error('navigation must contain at least one item');

  const seenIds = new Set<string>();
  let currentItemId: string | undefined;

  const items = input.items.map((item) => {
    const itemId = normalizeRequiredText('navigation item id', item.id);
    const itemLabel = normalizeRequiredText('navigation item label', item.label);
    if (seenIds.has(itemId)) throw new Error(`duplicate navigation item id: ${itemId}`);
    seenIds.add(itemId);

    const href = item.href?.trim();
    if (item.href !== undefined && !href) throw new Error('navigation item href must be non-empty');

    const disabled = item.disabled ?? false;
    const current = item.current ?? false;
    if (current) {
      if (currentItemId !== undefined) throw new Error('navigation can contain only one current item');
      if (disabled) throw new Error('current navigation item cannot be disabled');
      currentItemId = itemId;
    }

    return Object.freeze({
      id: itemId,
      label: itemLabel,
      ...(href ? { href } : {}),
      current,
      disabled,
      focusable: !disabled,
      ...(current ? { ariaCurrent: 'page' as const } : {}),
    });
  });

  return Object.freeze({
    id,
    label,
    kind,
    role: kind === 'tabs' ? 'tablist' : 'navigation',
    items: Object.freeze(items),
    ...(currentItemId ? { currentItemId } : {}),
  });
}
