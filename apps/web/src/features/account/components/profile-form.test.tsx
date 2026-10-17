import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { ProfileState } from '@/features/account/shared/form-state';

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
vi.mock('@/features/account/server/actions', () => ({
  updateProfile: async () => ({}),
}));

import { ProfileForm } from './profile-form';

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
const ALERT = /<p[^>]*\brole="alert"[^>]*>/;

function render(state: ProfileState): string {
  result.state = state;
  return renderToStaticMarkup(<ProfileForm defaultName="Ada" />);
}

describe('ProfileForm', () => {
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
      error: 'Sign in again to update your profile.',
      name: 'Ada',
    });

    const input = attributesOf(html, NAME_INPUT);
    expect(input['aria-invalid']).toBeUndefined();
    expect(input['aria-describedby']).toBeUndefined();
  });
});
