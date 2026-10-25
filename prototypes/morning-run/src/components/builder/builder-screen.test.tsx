import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewProvider } from '@/components/view-provider';
import { customRunsStore, prefsStore } from '@/lib/storage/stores';
import { BuilderScreen } from './builder-screen';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/builder',
}));

const mount = (editId?: string) =>
  render(
    <ViewProvider initial="focus">
      <BuilderScreen editId={editId} />
    </ViewProvider>,
  );

beforeEach(() => {
  push.mockClear();
  customRunsStore.set([]);
  prefsStore.set({ pinned: [] });
});

describe('BuilderScreen', () => {
  it('builds a run from reusable steps, saves it and pins it', async () => {
    const user = userEvent.setup();
    mount();
    await user.type(await screen.findByLabelText('Name'), 'Sunday reset');
    await user.click(screen.getByRole('button', { name: /Energy check/ }));
    await user.click(screen.getByRole('button', { name: /Gratitude/ }));
    await user.click(screen.getByRole('button', { name: /Breathing/ }));
    expect(screen.getByText('3 steps · about 2 min')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    const saved = customRunsStore.getSnapshot();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Sunday reset',
      group: 'My runs',
      builtIn: false,
    });
    expect(saved[0]!.steps.map((s) => s.kind)).toEqual([
      'scale',
      'pick',
      'breathe',
    ]);
    expect(prefsStore.getSnapshot().pinned).toEqual([saved[0]!.id]);
    expect(push).toHaveBeenCalledWith('/');
  });

  it('explains what is missing instead of saving a half-made run', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(/give it a name/)).toBeInTheDocument();
    expect(
      within(alert).getByText(/add at least one step/),
    ).toBeInTheDocument();
    expect(customRunsStore.getSnapshot()).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it('reorders and removes steps', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByLabelText('Name');
    await user.click(screen.getByRole('button', { name: /Energy check/ }));
    await user.click(screen.getByRole('button', { name: /Free write/ }));
    await user.click(screen.getByRole('button', { name: 'Move step 2 up' }));
    const titles = screen
      .getAllByLabelText('Title')
      .map((el) => (el as HTMLInputElement).value);
    expect(titles).toEqual(["What's on your mind?", 'Energy check']);
    await user.click(screen.getByRole('button', { name: 'Remove step 1' }));
    expect(screen.getAllByLabelText('Title')).toHaveLength(1);
  });

  it('turns the option list into pick limits', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByLabelText('Name');
    await user.click(screen.getByRole('button', { name: /Choose a few/ }));
    const options = screen.getByLabelText('Options, one per line');
    await user.clear(options);
    await user.type(options, 'Tea{Enter}Coffee{Enter}Water');
    const limit = screen.getByLabelText('How many can be chosen');
    expect(
      within(limit)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Just one', 'Up to 2', 'Up to 3']);
  });

  it('edits an existing run', async () => {
    const user = userEvent.setup();
    mount();
    await user.type(await screen.findByLabelText('Name'), 'First draft');
    await user.click(screen.getByRole('button', { name: /Rating/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const id = customRunsStore.getSnapshot()[0]!.id;

    push.mockClear();
    const { unmount } = mount(id);
    unmount();
    mount(id);
    const name = await screen.findAllByLabelText('Name');
    await user.clear(name[name.length - 1]!);
    await user.type(name[name.length - 1]!, 'Second draft');
    await user.click(screen.getAllByRole('button', { name: 'Save' }).at(-1)!);
    expect(customRunsStore.getSnapshot()).toHaveLength(1);
    expect(customRunsStore.getSnapshot()[0]!.name).toBe('Second draft');
  });
});
