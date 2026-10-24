import { describe, expect, it } from 'vitest';

import { emptyRecords } from '../record-tables';
import { addLink } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

describe('addLink', () => {
  it('requires a name and a valid URL', () => {
    expect(addLink(emptyRecords(), '', 'example.com', ctx).link).toEqual({});
    expect(addLink(emptyRecords(), 'Docs', 'javascript:x', ctx).link).toEqual(
      {},
    );
    const r = addLink(emptyRecords(), ' Docs ', 'example.com', ctx);
    expect(Object.values(r.link)).toEqual([
      expect.objectContaining({ name: 'Docs', url: 'https://example.com/' }),
    ]);
  });
});
