import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResendButton } from './resend-button';

const show = (props: Partial<Parameters<typeof ResendButton>[0]> = {}) =>
  render(
    <form onSubmit={props.pending === undefined ? undefined : undefined}>
      <ResendButton
        label="Resend link"
        pending={false}
        wait={0}
        hintId="hint"
        {...props}
      />
    </form>,
  );

describe('ResendButton', () => {
  it('is a free submit button when nothing is waiting', () => {
    show();
    const button = screen.getByRole('button', { name: 'Resend link' });

    expect(button.getAttribute('type')).toBe('submit');
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.queryByText(/You can request another/)).toBeNull();
  });

  it('says it is sending, and busy, while pending', () => {
    show({ pending: true });
    const button = screen.getByRole('button', { name: 'Sending…' });

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('explains the wait and links the button to the explanation', () => {
    show({ wait: 42 });
    const button = screen.getByRole('button', { name: 'Resend link' });

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-describedby')).toBe('hint');
    expect(document.getElementById('hint')?.textContent).toBe(
      'You can request another in 42s.',
    );
  });

  it('stays focusable while it waits', () => {
    show({ wait: 5 });
    const button = screen.getByRole('button', { name: 'Resend link' });

    expect(button.hasAttribute('disabled')).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('blocks the click while it waits, so nothing is submitted', () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    const { container } = show({ wait: 5 });
    container.querySelector('form')!.addEventListener('submit', onSubmit);

    fireEvent.click(screen.getByRole('button', { name: 'Resend link' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when it is free', () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    const { container } = show();
    container.querySelector('form')!.addEventListener('submit', onSubmit);

    fireEvent.click(screen.getByRole('button', { name: 'Resend link' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
