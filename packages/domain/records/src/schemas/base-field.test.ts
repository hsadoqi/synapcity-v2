import { describe, expect, it } from 'vitest';

import { RECORD_MESSAGES } from '../constants';

import {
  baseRecordCreateSchema,
  baseRecordMetadataSchema,
  baseRecordPatchSchema,
  boundedIconSchema,
  boundedNameSchema,
  recordPatchSchema,
} from './index';

// A valid set of editable fields; each test changes one.
const fields = { name: 'Launch plan', icon: 'file-text', tags: ['work'] };

describe('Base Fields', () => {
  describe('baseRecordMetadataSchema (the shared stored metadata)', () => {
    it('parses the stored fields and trims the name', () => {
      expect(
        baseRecordMetadataSchema.parse({
          ...fields,
          name: '  Launch plan  ',
          description: 'About',
        }),
      ).toEqual({ ...fields, name: 'Launch plan', description: 'About' });
    });

    it('leaves the description optional', () => {
      expect(baseRecordMetadataSchema.parse(fields)).not.toHaveProperty(
        'description',
      );
    });

    it.each([
      ['a blank name', { name: '   ' }],
      ['an icon that is not kebab-case', { icon: 'Pen' }],
      ['tags that are not an array', { tags: 'work' }],
    ])('rejects %s', (_name, override) => {
      expect(
        baseRecordMetadataSchema.safeParse({ ...fields, ...override }).success,
      ).toBe(false);
    });

    it('rejects persisted metadata outside the same bounds as a write', () => {
      const invalid = {
        name: 'a'.repeat(121),
        description: 'd'.repeat(5000),
        icon: 'a'.repeat(65),
        tags: Array.from({ length: 21 }, () => ' same '),
      };
      expect(baseRecordMetadataSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('baseRecordMetadataSchema bounds', () => {
    const parse = (override: object) =>
      baseRecordMetadataSchema.safeParse({ ...fields, ...override });

    it('accepts values at every limit', () => {
      expect(
        parse({
          name: 'a'.repeat(120),
          description: 'd'.repeat(2000),
          icon: 'a'.repeat(64),
          tags: Array.from({ length: 20 }, (_, i) => `t${i}`),
        }).success,
      ).toBe(true);
      expect(parse({ tags: ['a'.repeat(50)] }).success).toBe(true);
    });

    it.each([
      [
        'a name of 121 characters',
        { name: 'a'.repeat(121) },
        RECORD_MESSAGES.nameTooLong,
      ],
      [
        'a description of 2001 characters',
        { description: 'd'.repeat(2001) },
        RECORD_MESSAGES.descriptionTooLong,
      ],
      [
        'an icon of 65 characters',
        { icon: 'a'.repeat(65) },
        RECORD_MESSAGES.iconTooLong,
      ],
      [
        '21 tags',
        { tags: Array.from({ length: 21 }, (_, i) => `t${i}`) },
        RECORD_MESSAGES.tooManyTags,
      ],
      [
        'a tag of 51 characters',
        { tags: ['a'.repeat(51)] },
        RECORD_MESSAGES.tagTooLong,
      ],
      [
        'a duplicate tag ignoring case',
        { tags: ['Work', 'work'] },
        RECORD_MESSAGES.duplicateTag,
      ],
      ['a NUL in the name', { name: 'a\u0000b' }, RECORD_MESSAGES.storableText],
      [
        'a NUL in the description',
        { description: 'a\u0000b' },
        RECORD_MESSAGES.storableText,
      ],
      ['a NUL in a tag', { tags: ['a\u0000b'] }, RECORD_MESSAGES.storableText],
    ])('rejects %s, saying why', (_name, override, message) => {
      const result = parse(override);
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain(message);
    });

    it('counts characters, not UTF-16 units: 120 emoji pass, 121 do not', () => {
      expect(parse({ name: '😀'.repeat(120) }).success).toBe(true);
      expect(parse({ name: '😀'.repeat(121) }).success).toBe(false);
    });

    it('trims tags and the name rather than cutting anything', () => {
      const result = parse({
        name: '  Launch plan  ',
        tags: ['  padded  ', 'two words'],
      });
      expect(result.data).toMatchObject({
        name: 'Launch plan',
        tags: ['padded', 'two words'],
      });
      expect(parse({ tags: ['   '] }).success).toBe(false);
    });

    it('reports the position of a duplicate tag', () => {
      const result = parse({ tags: ['a', 'b', 'A'] });
      expect(
        result.error?.issues.find(
          (i) => i.message === RECORD_MESSAGES.duplicateTag,
        )?.path,
      ).toEqual(['tags', 2]);
    });
  });

  describe('hardening of what a person can write', () => {
    const parse = (override: object) =>
      baseRecordMetadataSchema.safeParse({ ...fields, ...override });
    const ZWSP = '\u200B';
    const RLO = '\u202E';

    it.each([
      ['an unknown key', { extra: 1 }],
      ['an id', { id: '11111111-1111-4111-8111-111111111111' }],
      ['an owner', { ownerId: '11111111-1111-4111-8111-111111111111' }],
      ['a pin time', { pinnedAt: '2026-10-01T09:00:00Z' }],
      ['a created time', { createdAt: '2026-10-01T09:00:00Z' }],
    ])(
      'refuses %s: a write carries the editable fields and nothing else',
      (_name, override) => {
        const result = parse(override);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
      },
    );

    it('refuses unknown metadata keys instead of silently erasing them', () => {
      expect(
        baseRecordMetadataSchema.safeParse({ ...fields, extra: 1 }).success,
      ).toBe(false);
    });

    describe.each([
      ['name', (value: string) => ({ name: value })],
      ['tag', (value: string) => ({ tags: [value] })],
    ])('a %s', (_field, make) => {
      it.each([
        ['a newline', 'a\nb'],
        ['a tab', 'a\tb'],
        ['a carriage return', 'a\rb'],
        ['a bell', 'a\u0007b'],
        ['DEL', 'a\u007Fb'],
        ['a right-to-left override', `a${RLO}b`],
      ])('rejects %s, saying to use one line', (_name, value) => {
        const result = parse(make(value));
        expect(result.success).toBe(false);
        expect(result.error?.issues.map((i) => i.message)).toContain(
          RECORD_MESSAGES.singleLine,
        );
      });

      it.each([
        ['only a zero-width space', ZWSP],
        ['only invisible format characters', `${ZWSP}\u200C\u2060\uFEFF`],
        ['only a no-break space', '\u00A0'],
      ])('rejects %s: it would show as nothing', (_name, value) => {
        expect(parse(make(value)).success).toBe(false);
      });

      it('accepts emoji joined by zero-width joiners, and text with an invisible character beside a visible one', () => {
        expect(parse(make('👨\u200D👩\u200D👧')).success).toBe(true);
        expect(parse(make(`ab${ZWSP}`)).success).toBe(true);
      });
    });

    it('uses the caller’s blank wording for an invisible-only name', () => {
      expect(
        boundedNameSchema('Give this record a title.').safeParse(ZWSP).error
          ?.issues[0]?.message,
      ).toBe('Give this record a title.');
      expect(
        boundedNameSchema().safeParse(ZWSP).error?.issues[0]?.message,
      ).toBe(RECORD_MESSAGES.invisible);
    });

    describe('a description', () => {
      it.each([
        ['a newline', 'line one\nline two'],
        ['a Windows line break', 'one\r\ntwo'],
        ['a tab', 'a\tb'],
        ['joined emoji', '👨\u200D👩\u200D👧'],
      ])('accepts %s', (_name, value) => {
        expect(parse({ description: value }).success).toBe(true);
      });

      it.each([
        ['a bell', 'a\u0007b'],
        ['an escape', 'a\u001Bb'],
        ['a vertical tab', 'a\u000Bb'],
        ['DEL', 'a\u007Fb'],
        ['a right-to-left override', `a${RLO}b`],
      ])('rejects %s', (_name, value) => {
        const result = parse({ description: value });
        expect(result.success).toBe(false);
        expect(result.error?.issues.map((i) => i.message)).toContain(
          RECORD_MESSAGES.plainText,
        );
      });
    });
  });

  describe('boundedNameSchema', () => {
    it('trims, and returns the name', () => {
      expect(boundedNameSchema().parse('  Garden  ')).toBe('Garden');
    });

    it('says what a blank name says: the default, or the caller’s own wording', () => {
      expect(
        boundedNameSchema().safeParse('  ').error?.issues[0]?.message,
      ).not.toBe('Give this record a title.');
      expect(
        boundedNameSchema('Give this record a title.').safeParse('  ').error
          ?.issues[0]?.message,
      ).toBe('Give this record a title.');
    });

    it('keeps the length limit and the storable-text rule whatever the blank wording', () => {
      const named = boundedNameSchema('Give it a name.');
      expect(named.safeParse('a'.repeat(120)).success).toBe(true);
      expect(named.safeParse('a'.repeat(121)).error?.issues[0]?.message).toBe(
        RECORD_MESSAGES.nameTooLong,
      );
      expect(named.safeParse('a\ud83db').success).toBe(false); // an unpaired surrogate
    });
  });

  describe('boundedIconSchema', () => {
    it.each(['folder', 'layout-dashboard', 'a1-b2', 'a'.repeat(64)])(
      'accepts %s',
      (icon) => {
        expect(boundedIconSchema().safeParse(icon).success).toBe(true);
      },
    );

    it.each([
      'Folder',
      'two--dashes',
      '-lead',
      'trail-',
      'with space',
      '',
      'a'.repeat(65),
    ])('rejects %j', (icon) => {
      expect(boundedIconSchema().safeParse(icon).success).toBe(false);
    });

    it('uses the caller’s message for a bad shape, and its own for a long name', () => {
      expect(
        boundedIconSchema('Use a Lucide icon name.').safeParse('Bad Icon').error
          ?.issues[0]?.message,
      ).toBe('Use a Lucide icon name.');
      expect(
        boundedIconSchema().safeParse('a'.repeat(65)).error?.issues[0]?.message,
      ).toBe(RECORD_MESSAGES.iconTooLong);
    });
  });
  describe('a blank name reports one issue, not one per rule', () => {
    it.each(['', '   '])('%j', (value) => {
      const result = boundedNameSchema('Give it a name.').safeParse(value);
      expect(result.error?.issues.map((i) => i.message)).toEqual([
        'Give it a name.',
      ]);
    });

    it('a blank tag reports one issue', () => {
      const result = baseRecordMetadataSchema.safeParse({
        ...fields,
        tags: ['  '],
      });
      expect(result.error?.issues).toHaveLength(1);
    });
  });

  describe('baseRecordCreateSchema (what creating a record takes)', () => {
    it('needs only a name; the database fills the other columns', () => {
      expect(baseRecordCreateSchema.parse({ name: '  Plan  ' })).toEqual({
        name: 'Plan',
      });
    });

    it('takes the other editable fields, bounded as any write', () => {
      expect(baseRecordCreateSchema.parse(fields)).toEqual(fields);
      expect(
        baseRecordCreateSchema.safeParse({ ...fields, icon: 'Bad Icon' })
          .success,
      ).toBe(false);
    });

    it.each(['id', 'ownerId', 'createdAt', 'updatedAt', 'pinnedAt'])(
      'refuses the server-managed field %s',
      (field) => {
        const result = baseRecordCreateSchema.safeParse({
          name: 'Plan',
          [field]: 'x',
        });
        expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
      },
    );

    it('requires a name', () => {
      expect(baseRecordCreateSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('baseRecordPatchSchema (a partial edit)', () => {
    it('takes any one field', () => {
      expect(baseRecordPatchSchema.parse({ tags: [] })).toEqual({ tags: [] });
      expect(baseRecordPatchSchema.parse({ name: ' Plan ' })).toEqual({
        name: 'Plan',
      });
    });

    it('refuses an empty edit', () => {
      const result = baseRecordPatchSchema.safeParse({});
      expect(result.error?.issues[0]?.message).toBe(RECORD_MESSAGES.emptyPatch);
      expect(baseRecordPatchSchema.safeParse({ name: undefined }).success).toBe(
        false,
      );
    });

    it('keeps the bounds and refuses server-managed fields', () => {
      expect(
        baseRecordPatchSchema.safeParse({ name: 'a'.repeat(121) }).success,
      ).toBe(false);
      expect(
        baseRecordPatchSchema.safeParse({ name: 'Plan', id: 'x' }).success,
      ).toBe(false);
    });

    it('carries a kind\u2019s own wording through recordPatchSchema', () => {
      const kindInput = baseRecordMetadataSchema.extend({
        name: boundedNameSchema('Give this record a title.'),
      });
      const result = recordPatchSchema(kindInput).safeParse({ name: ' ' });
      expect(result.error?.issues[0]?.message).toBe(
        'Give this record a title.',
      );
    });
  });
});
