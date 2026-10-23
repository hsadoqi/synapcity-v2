import { describe, expect, it } from 'vitest';

import {
  ENTITY_ICON_GROUPS,
  findEntityIcon,
} from '@synapcity/frontend-ui/blocks/entity/entity-icon';

const all = ENTITY_ICON_GROUPS.flatMap((group) => group.icons);

describe('entity icons', () => {
  // The column defaults (spaces, documents, dashboards) and the seeded values.
  it.each([
    'folder',
    'file-text',
    'layout-dashboard',
    'pen-line',
    'book-open',
    'house',
  ])('includes %s, which the database already stores', (name) => {
    expect(findEntityIcon(name)?.name).toBe(name);
  });

  it('lists every identifier once', () => {
    const names = all.map((option) => option.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses identifiers the database constraint accepts, each with a label', () => {
    for (const option of all) {
      expect(option.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(option.label.trim()).not.toBe('');
    }
  });

  it.each(['__proto__', 'constructor', 'toString', ''])(
    'misses for %s rather than finding an object property',
    (name) => {
      expect(findEntityIcon(name)).toBeUndefined();
    },
  );
});
