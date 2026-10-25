import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import { EntityDialog } from '@synapcity/frontend-ui/blocks/entity-dialog';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';

/** Plain fields: the shell supplies the form, the footer and the states. */
const fields = (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor="slot-name">Name</Label>
    <Input id="slot-name" name="name" defaultValue="Standup" />
  </div>
);

const meta: Meta<typeof EntityDialog> = {
  title: 'Blocks/EntityDialog',
  component: EntityDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    mode: 'create',
    entityName: 'event',
    trigger: <Button variant="outline">Open</Button>,
    onSubmit: fn(),
    onOpenChange: fn(),
    children: fields,
  },
  argTypes: {
    mode: { control: 'select', options: ['create', 'edit'] },
    presentation: { control: 'select', options: ['dialog', 'sheet', 'inline'] },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    width: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
    trigger: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof EntityDialog>;

const open = async (canvasElement: HTMLElement) => {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: 'Open' }),
  );
  return screen.findByRole('dialog');
};

export const Create: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await open(canvasElement);
    await expect(dialog).toHaveAccessibleName('New event');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Create' }),
    );
    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const Edit: Story = {
  args: { mode: 'edit' },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(dialog).toHaveAccessibleName('Edit event');
    // The dialog fades in; wait for it rather than assert mid-animation.
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save changes' }),
      ).toBeVisible(),
    );
  },
};

/** Delete is edit-only and asks first. */
export const WithDelete: Story = {
  args: { mode: 'edit', entityLabel: 'Standup', onDelete: fn() },
  play: async ({ canvasElement, args }) => {
    const dialog = await open(canvasElement);
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' }),
    );
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Delete Standup?',
    });
    await expect(args.onDelete).not.toHaveBeenCalled();
    await userEvent.click(
      within(confirm).getByRole('button', { name: 'Delete' }),
    );
    await waitFor(() => expect(args.onDelete).toHaveBeenCalledTimes(1));
  },
};

export const Sheet: Story = {
  args: { presentation: 'sheet' },
  play: async ({ canvasElement }) => {
    const sheet = await open(canvasElement);
    await expect(sheet).toHaveAttribute('data-slot', 'sheet-content');
  },
};

export const SheetWithDelete: Story = {
  args: { presentation: 'sheet', mode: 'edit', onDelete: fn() },
  play: async ({ canvasElement }) => {
    const sheet = await open(canvasElement);
    // The sheet fades in; wait for it rather than assert mid-animation.
    await waitFor(() =>
      expect(
        within(sheet).getByRole('button', { name: 'Delete' }),
      ).toBeVisible(),
    );
  },
};

/** In the page: no overlay, and the owner takes it away on `onOpenChange(false)`. */
export const Inline: Story = {
  args: { presentation: 'inline', mode: 'edit', trigger: undefined },
  render: (args) => (
    <div className="w-sm rounded-xl border border-border bg-card p-4 text-card-foreground">
      <EntityDialog {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const region = within(canvasElement).getByRole('region', {
      name: 'Edit event',
    });
    await userEvent.click(
      within(region).getByRole('button', { name: 'Cancel' }),
    );
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

/** The save is still running: buttons lock and the dialog cannot be dismissed. */
export const Pending: Story = {
  args: { onSubmit: () => new Promise<void>(() => {}) },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    const save = within(dialog).getByRole('button', { name: 'Create' });
    await userEvent.click(save);
    await waitFor(() => expect(save).toBeDisabled());
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();
  },
};

/** A failed save says so, never with the error's own text, and focuses the message. */
export const Failed: Story = {
  args: {
    onSubmit: () => Promise.reject(new Error('internal detail')),
    messages: { failed: 'Could not save. Try again.' },
  },
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Create' }),
    );
    const alert = await within(dialog).findByRole('alert');
    await expect(alert).toHaveTextContent('Could not save. Try again.');
    await expect(alert).toHaveFocus();
    await expect(dialog).not.toHaveTextContent('internal detail');
  },
};

/** Without `onSubmit` the children bring their own form and actions. */
export const BringYourOwnForm: Story = {
  args: { onSubmit: undefined },
  render: (args) => (
    <EntityDialog {...args}>
      {({ close }) => (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => event.preventDefault()}
        >
          {fields}
          <Button type="button" variant="outline" onClick={close}>
            Close from inside
          </Button>
        </form>
      )}
    </EntityDialog>
  ),
};

/** Scoped to a container, so it inherits that container's theme. */
export const InheritsLocalTheme: Story = {
  render: (args) => (
    <div className="theme-dark dark:theme-light rounded-xl bg-background p-6 text-foreground">
      <EntityDialog {...args} container="inline" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const dialog = await open(canvasElement);
    await expect(canvasElement.contains(dialog)).toBe(true);
  },
};
