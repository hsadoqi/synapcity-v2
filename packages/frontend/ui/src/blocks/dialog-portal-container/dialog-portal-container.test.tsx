import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@synapcity/frontend-ui/core/button';
import { DialogPortalContainer } from '@synapcity/frontend-ui/blocks/dialog-portal-container';

describe('DialogPortalContainer', () => {
  it('opens from its trigger as a dialog named and described by its text', async () => {
    render(
      <DialogPortalContainer
        trigger={<Button>Open settings</Button>}
        title="Settings"
        description="Configure the agenda."
      >
        <p>Body</p>
      </DialogPortalContainer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog.textContent).toContain('Configure the agenda.');
    expect(dialog.textContent).toContain('Body');
  });

  it('renders inline by default, inside the element that holds it', async () => {
    render(
      <section data-testid="scope">
        <DialogPortalContainer defaultOpen title="Inline" />
      </section>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('scope').contains(dialog)).toBe(true);
  });

  it('renders in body when asked', async () => {
    render(
      <section data-testid="scope">
        <DialogPortalContainer defaultOpen container="body" title="Global" />
      </section>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('scope').contains(dialog)).toBe(false);
    expect(
      document.querySelector('[data-slot="dialog-container-anchor"]'),
    ).toBeNull();
  });

  it('renders into a given container element', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    try {
      render(
        <DialogPortalContainer defaultOpen container={host} title="Hosted" />,
      );
      const dialog = await screen.findByRole('dialog');
      expect(host.contains(dialog)).toBe(true);
    } finally {
      host.remove();
    }
  });

  it('can omit the overlay and the close button', async () => {
    render(
      <DialogPortalContainer
        defaultOpen
        overlay={false}
        showCloseButton={false}
        title="Bare"
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('wraps the body in a scroll area only when scrollable', async () => {
    const { rerender } = render(
      <DialogPortalContainer defaultOpen title="Plain">
        <p>Body</p>
      </DialogPortalContainer>,
    );
    let dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('[data-slot="scroll-area"]')).toBeNull();

    rerender(
      <DialogPortalContainer defaultOpen scrollable title="Plain">
        <p>Body</p>
      </DialogPortalContainer>,
    );
    dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
  });

  it('renders a footer and stays controlled by its owner', async () => {
    const onOpenChange = vi.fn();
    render(
      <DialogPortalContainer
        open
        onOpenChange={onOpenChange}
        title="Controlled"
        footer={<Button>Save</Button>}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDefined();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalled());
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    // The owner did not update `open`, so the dialog stays.
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  describe('size', () => {
    const open = async (props: Record<string, unknown> = {}) => {
      render(
        <DialogPortalContainer defaultOpen title="Sized" {...props}>
          <p>Body</p>
        </DialogPortalContainer>,
      );
      return screen.findByRole('dialog');
    };

    it('is as tall as its content by default: no height cap, no height class', async () => {
      const dialog = await open();
      expect(dialog.className).not.toMatch(/max-h-/);
      expect(dialog.className).not.toMatch(/(^|\s)h-/);
      expect(dialog.style.maxHeight).toBe('');
    });

    it.each([
      ['sm', 'sm:max-h-96'],
      ['md', 'sm:max-h-112'],
      ['lg', 'sm:max-h-128'],
    ] as const)(
      'caps the height at the %s preset and scrolls',
      async (height, cls) => {
        const dialog = await open({ height });
        expect(dialog.classList.contains(cls)).toBe(true);
        expect(dialog.classList.contains('overflow-y-auto')).toBe(true);
      },
    );

    it.each([
      ['sm', 'sm:max-w-sm'],
      ['md', 'sm:max-w-md'],
      ['lg', 'sm:max-w-lg'],
    ] as const)('caps the width at the %s preset', async (width, cls) => {
      const dialog = await open({ width });
      expect(dialog.classList.contains(cls)).toBe(true);
    });

    it('fills its container with full: no cap at any width, a height of its own, a flex column', async () => {
      const dialog = await open({ width: 'full', height: 'full' });
      for (const cls of [
        'max-w-full',
        'sm:max-w-full',
        'h-full',
        'max-h-full',
        'sm:max-h-full',
        'flex',
        'flex-col',
      ]) {
        expect(dialog.classList.contains(cls), cls).toBe(true);
      }
      // The base dialog's own caps are replaced, not left beside it.
      expect(dialog.classList.contains('sm:max-w-sm')).toBe(false);
      expect(dialog.className).not.toContain('max-w-[calc(100%-2rem)]');
    });

    it('gives a full-height body the flex-1 child, not the popup', async () => {
      const dialog = await open({ height: 'full' });
      const body = screen.getByText('Body').parentElement!;
      expect(body.className).toContain('flex-1');
      expect(body.className).toContain('min-h-0');
      expect(dialog.classList.contains('flex-1')).toBe(false);
    });

    it('lets full height win over the scrollable height', async () => {
      const dialog = await open({ height: 'full', scrollable: true });
      expect(dialog.classList.contains('h-full')).toBe(true);
      expect(dialog.classList.contains('h-4/5')).toBe(false);
    });

    it('keeps the scrollable height when only scrollable is set', async () => {
      const dialog = await open({ scrollable: true });
      expect(dialog.classList.contains('h-4/5')).toBe(true);
      expect(dialog.classList.contains('flex')).toBe(true);
    });

    it('takes a number as a percentage of the container, with no preset class', async () => {
      const dialog = await open({ width: 60, height: 50 });
      expect(dialog.style.maxWidth).toBe('60%');
      expect(dialog.style.maxHeight).toBe('50%');
      // No preset height class. (The base dialog's own `sm:max-w-sm` stays in
      // the list; the inline max-width overrides it, which a browser story checks.)
      expect(dialog.className).not.toMatch(/sm:max-h-/);
    });

    it('gives a scrollable numeric height as the height itself', async () => {
      const dialog = await open({ height: 70, scrollable: true });
      expect(dialog.style.height).toBe('70%');
      expect(dialog.style.maxHeight).toBe('70%');
    });

    it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
      'ignores %s',
      async (value) => {
        const dialog = await open({ width: value, height: value });
        expect(dialog.style.maxWidth).toBe('');
        expect(dialog.style.maxHeight).toBe('');
      },
    );

    it('clamps a number over 100 to the container', async () => {
      const dialog = await open({ width: 250 });
      expect(dialog.style.maxWidth).toBe('100%');
    });
  });
});
