import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createToastManager,
  Toaster,
  useToastManager,
} from '@synapcity/frontend-ui/core/toast';

const manager = createToastManager();

afterEach(() => {
  act(() => {
    manager.close();
  });
});

const renderToaster = () =>
  render(
    <Toaster toastManager={manager}>
      <p>App</p>
    </Toaster>,
  );

/** Stacked toasts hide their controls from the a11y tree, so query by slot. */
const closeButtons = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-slot="toast-close"]'),
  );

const add = (options: Parameters<typeof manager.add>[0]) => {
  act(() => {
    manager.add({ timeout: 0, ...options });
  });
};

describe('Toaster', () => {
  it('renders its children and no toast at first', () => {
    renderToaster();

    expect(screen.getByText('App')).toBeTruthy();
    expect(document.querySelector('[data-slot="toast"]')).toBeNull();
  });

  it('shows a toast added through the manager', async () => {
    renderToaster();

    add({ title: 'Saved', description: 'Your changes were saved.' });

    expect(await screen.findByText('Saved')).toBeTruthy();
    expect(screen.getByText('Saved').getAttribute('data-slot')).toBe(
      'toast-title',
    );
    expect(
      screen.getByText('Your changes were saved.').getAttribute('data-slot'),
    ).toBe('toast-description');
  });

  it('places toasts in a viewport', async () => {
    renderToaster();

    add({ title: 'Saved' });
    await screen.findByText('Saved');

    expect(
      document
        .querySelector('[data-slot="toast-viewport"]')
        ?.contains(screen.getByText('Saved')),
    ).toBe(true);
  });

  it.each([
    ['success', true],
    ['info', true],
    ['warning', true],
    ['error', true],
    ['loading', true],
    [undefined, false],
    ['custom', false],
  ])('shows an icon for type %s: %s', async (type, hasIcon) => {
    renderToaster();

    add({ title: 'Message', type });
    await screen.findByText('Message');

    expect(document.querySelector('[data-slot="toast-icon"]') !== null).toBe(
      hasIcon,
    );
  });

  it.each([
    ['success', 'bg-success'],
    ['info', 'bg-info'],
    ['warning', 'bg-warning'],
    ['error', 'bg-destructive'],
  ])('puts the %s icon on a chip in its status colour', async (type, fill) => {
    renderToaster();

    add({ title: 'Message', type });
    await screen.findByText('Message');

    const icon = document.querySelector('[data-slot="toast-icon"]');
    expect(icon?.getAttribute('data-type')).toBe(type);
    expect(icon?.className).toContain(fill);
  });

  it('does not treat an inherited name as a type', async () => {
    renderToaster();

    add({ title: 'Message', type: 'constructor' });
    await screen.findByText('Message');

    expect(document.querySelector('[data-slot="toast-icon"]')).toBeNull();
  });

  it('hides icons from assistive tech', async () => {
    renderToaster();

    add({ title: 'Done', type: 'success' });
    await screen.findByText('Done');

    expect(
      document
        .querySelector('[data-slot="toast-icon"] svg')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('dismisses a toast with its close button', async () => {
    renderToaster();

    add({ title: 'Saved' });
    await screen.findByText('Saved');
    fireEvent.click(closeButtons()[0]!);

    await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
  });

  it('renders an action button and calls its handler', async () => {
    const onClick = vi.fn();
    renderToaster();

    add({ title: 'Deleted', actionProps: { children: 'Undo', onClick } });
    await screen.findByText('Deleted');

    const action = screen.getByRole('button', { name: 'Undo' });
    expect(action.getAttribute('data-slot')).toBe('toast-action');

    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('stacks several toasts', async () => {
    renderToaster();

    add({ title: 'First' });
    add({ title: 'Second' });

    expect(await screen.findByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(closeButtons()).toHaveLength(2);
    expect(closeButtons()[0]?.getAttribute('aria-label')).toBe('Close toast');
  });

  it('closes everything through the manager', async () => {
    renderToaster();

    add({ title: 'Saved' });
    await screen.findByText('Saved');
    act(() => {
      manager.close();
    });

    await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
  });
});

describe('useToastManager', () => {
  it('lets a component inside the provider add toasts', async () => {
    const Adder = () => {
      const { add: addToast } = useToastManager();
      return (
        <button onClick={() => addToast({ title: 'From hook', timeout: 0 })}>
          Add
        </button>
      );
    };
    render(
      <Toaster toastManager={manager}>
        <Adder />
      </Toaster>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('From hook')).toBeTruthy();
  });
});
