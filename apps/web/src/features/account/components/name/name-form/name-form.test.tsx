import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { ProfileState } from '@/features/account/types';
import { MAX_NAME_LENGTH } from '@synapcity/domain-identity';

/**
 * Renders the real form with the state a submit returned. `useActionState` is
 * the one piece replaced: it is how React hands that state in, and a static
 * render cannot run the action itself.
 */
const result = vi.hoisted(() => ({ state: {} as ProfileState }));

vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useActionState: () => [result.state, () => {}, false],
}));
vi.mock('@/features/account/server/actions/name-actions', () => ({
  updateName: async () => ({}),
}));

import { NameForm } from './name-form';

/** The attributes of the first rendered tag that matches (the test runs in node, without a DOM). */
function attributesOf(html: string, tag: RegExp): Record<string, string> {
  const element = html.match(tag)?.[0];
  if (!element) throw new Error(`No element matching ${tag} in ${html}`);
  return Object.fromEntries(
    Array.from(element.matchAll(/([\w-]+)="([^"]*)"/g), ([, name, value]) => [
      name!,
      value!,
    ]),
  );
}

const NAME_INPUT = /<input[^>]*\bid="name"[^>]*>/;
const FORM = /<form[^>]*>/;
const ALERT = /<p[^>]*\brole="alert"[^>]*>/;

function render(state: ProfileState): string {
  result.state = state;
  return renderToStaticMarkup(<NameForm defaultName="Ada" />);
}

describe('NameForm', () => {
  it('marks the name invalid and points it at the error that explains why', () => {
    const html = render({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
    });

    const input = attributesOf(html, NAME_INPUT);
    const alert = attributesOf(html, ALERT);
    expect(input['aria-invalid']).toBe('true');
    expect(alert.id).toBeTruthy();
    expect(input['aria-describedby']).toBe(alert.id);
  });

  it('leaves the name alone for an error about no one field', () => {
    const html = render({
      error: 'Sign in again to update your Name.',
      name: 'Ada',
    });

    const input = attributesOf(html, NAME_INPUT);
    expect(input['aria-invalid']).toBeUndefined();
    // The error is not about this field, so only the hint describes it.
    expect(input['aria-describedby']).toBe('name-hint');
  });

  it('describes the name with its length limit until an error replaces it', () => {
    const calm = render({ name: 'Ada' });
    const input = attributesOf(calm, NAME_INPUT);
    const hint = calm.match(/<p[^>]*\bid="name-hint"[^>]*>([^<]*)</);
    expect(hint?.[1]).toBe(`Up to ${MAX_NAME_LENGTH} characters.`);
    expect(input['aria-describedby']).toBe('name-hint');

    const failed = render({
      error: 'Enter your name.',
      fields: ['name'],
      name: '',
    });
    expect(failed).not.toContain('name-hint');
  });

  it('leaves validation to the server so its message is the one shown', () => {
    const form = attributesOf(render({ name: 'Ada' }), FORM);
    // A static render prints React's own spelling of the attribute.
    expect('noValidate' in form).toBe(true);
  });
});
