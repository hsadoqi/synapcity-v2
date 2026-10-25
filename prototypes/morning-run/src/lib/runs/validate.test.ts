import { describe, expect, it } from 'vitest';

import { STEP_TEMPLATES } from './templates';
import type { Run } from './schema';
import { validateRun } from './validate';

const draft = (over: Partial<Run> = {}): Run => ({
  id: 'custom-1',
  group: 'My runs',
  name: 'Sunday reset',
  tagline: 'Plan the week ahead',
  icon: 'star',
  steps: [STEP_TEMPLATES[0]!.make()],
  builtIn: false,
  ...over,
});

describe('validateRun', () => {
  it('accepts a run built from templates', () => {
    expect(validateRun(draft()).ok).toBe(true);
  });

  it('builds a valid step from every template', () => {
    for (const template of STEP_TEMPLATES) {
      const result = validateRun(draft({ steps: [template.make()] }));
      expect(result.ok, template.id).toBe(true);
    }
  });

  it('gives every step its own id', () => {
    const a = STEP_TEMPLATES[0]!.make();
    const b = STEP_TEMPLATES[0]!.make();
    expect(a.id).not.toBe(b.id);
  });

  it('explains a missing name and an empty run in plain language', () => {
    const result = validateRun(draft({ name: ' ', steps: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const text = result.problems.map((p) => p.message).join(' | ');
      expect(text).toContain('give it a name');
      expect(text).toContain('add at least one step');
    }
  });

  it('points at the step with a bad option list', () => {
    const pick = STEP_TEMPLATES.find((t) => t.id === 'pick-one')!.make();
    if (pick.kind !== 'pick') throw new Error('expected a pick step');
    const result = validateRun(
      draft({ steps: [{ ...pick, options: ['Only one'] }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.problems[0]?.message).toMatch(
        /^Step 1: a list needs 2 to 10 options/,
      );
  });
});
