import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/u1/settings' }));
vi.mock('@synapcity/frontend-ui/core/toast', () => ({
  toast: { add: vi.fn() },
}));

import { type ProfileState } from '../../../../contracts';
import { MAX_NAME_LENGTH } from '@synapcity/domain-identity';
import { ProfileFormShell } from '../../../next/components/profile-form-shell';
import { NameField } from './name-field';

const show = (
  props: Partial<Parameters<typeof NameField>[0]> = {},
  initialState: ProfileState = {},
) =>
  render(
    <ProfileFormShell
      signInHref={signInHref}
      action={async () => ({})}
      initialState={initialState}
      submitLabel="Save"
    >
      <NameField defaultName="Ada" {...props} />
    </ProfileFormShell>,
  );

const input = () => screen.getByLabelText('Name') as HTMLInputElement;

const signInHref = (to: string) => `/auth/login?next=${encodeURIComponent(to)}`;

describe('NameField', () => {
  it('is a required name input that autocompletes the person’s name', () => {
    show();

    expect(input().name).toBe('name');
    expect(input().type).toBe('text');
    expect(input().required).toBe(true);
    expect(input().autocomplete).toBe('name');
    expect(input().maxLength).toBe(MAX_NAME_LENGTH);
  });

  it('starts with the current name', () => {
    show({ defaultName: 'Grace Hopper' });

    expect(input().value).toBe('Grace Hopper');
  });

  it('states its length rule and describes the input by it', () => {
    show();

    expect(
      document.getElementById(input().getAttribute('aria-describedby')!)
        ?.textContent,
    ).toBe(`Up to ${MAX_NAME_LENGTH} characters.`);
  });

  it('keeps what was typed when a save fails, and marks the error', () => {
    show({}, { error: 'Enter a name.', fields: ['name'], name: 'A typo' });

    expect(input().value).toBe('A typo');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toBe('Enter a name.');
    expect(input().getAttribute('aria-describedby')).toBe(
      screen.getByRole('alert').id,
    );
  });

  it('is not marked invalid by an error on another field', () => {
    show({}, { error: 'Bad photo.', fields: ['avatar'] });

    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });
});
