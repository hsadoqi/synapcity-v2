import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { z } from 'zod';

import { defineForm } from '../../utils';
import { FormRenderer } from './form-renderer';

const meta: Meta<typeof FormRenderer> = {
  title: 'Forms/FormRenderer',
  component: FormRenderer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormRenderer>;

const signUp = defineForm({
  schema: z.object({
    name: z.string().min(2, 'Use at least 2 characters.'),
    email: z.email('Enter a valid email address.'),
    plan: z.enum(['free', 'pro']),
    frequency: z.enum(['daily', 'weekly']),
    notify: z.boolean().optional(),
  }),
  fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'email', name: 'email', label: 'Email' },
    {
      type: 'select',
      name: 'plan',
      label: 'Plan',
      options: [
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
      ],
    },
    {
      type: 'radio',
      name: 'frequency',
      label: 'Digest',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
      ],
    },
    { type: 'switch', name: 'notify', label: 'Email me updates' },
  ],
});

export const Default: Story = {
  args: { definition: signUp as never, onSubmit: fn() },
};

/** An empty submit shows each field's own error and keeps the handler uncalled. */
export const ShowsErrorsOnEmptySubmit: Story = {
  args: { definition: signUp as never, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(
      await canvas.findByText('Use at least 2 characters.'),
    ).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** A valid form calls the handler once with the typed values. */
export const SubmitsValidValues: Story = {
  args: { definition: signUp as never, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Name' }), 'Ada');
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Email' }),
      'ada@example.com',
    );
    await userEvent.click(canvas.getByRole('radio', { name: 'Weekly' }));
    await userEvent.click(canvas.getByRole('combobox', { name: 'Plan' }));
    await userEvent.click(
      await within(document.body).findByRole('option', { name: 'Pro' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ada',
        email: 'ada@example.com',
        plan: 'pro',
        frequency: 'weekly',
      }),
    );
  },
};

/** A handler that throws shows the generic message, never the error's own text. */
export const SubmitFailure: Story = {
  args: {
    definition: signUp as never,
    initialValues: {
      name: 'Ada',
      email: 'ada@example.com',
      plan: 'free',
      frequency: 'daily',
    } as never,
    onSubmit: () => {
      throw new Error('database password is hunter2');
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(
      await canvas.findByText('Something went wrong. Try again.'),
    ).toBeVisible();
    await expect(canvas.queryByText(/hunter2/)).toBeNull();
  },
};

const typed = defineForm({
  schema: z.object({
    birthday: z.string().min(1, 'Choose a date.'),
    reminder: z.string().optional(),
    accent: z.string().optional(),
    seats: z.number().min(1).max(10),
    volume: z.number().min(0).max(100),
    slug: z.string().regex(/^[a-z-]+$/, 'Use lowercase letters and dashes.'),
  }),
  fields: [
    { type: 'date', name: 'birthday', label: 'Birthday' },
    { type: 'time', name: 'reminder', label: 'Reminder time' },
    { type: 'color', name: 'accent', label: 'Accent colour' },
    {
      type: 'number',
      name: 'seats',
      label: 'Seats',
      props: { min: 1, max: 10 },
    },
    {
      type: 'range',
      name: 'volume',
      label: 'Volume',
      props: { min: 0, max: 100 },
    },
    {
      type: 'text',
      name: 'slug',
      label: 'Slug',
      props: { pattern: '[a-z-]+' },
    },
  ],
});

/** Date, time, colour, number, range, and a text field with a pattern. */
export const DateTimeColourAndPattern: Story = {
  args: { definition: typed as never, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Slug' }),
      'Not Valid',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(
      await canvas.findByText('Use lowercase letters and dashes.'),
    ).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

const conditional = defineForm({
  schema: z.object({
    contact: z.enum(['email', 'phone']),
    email: z.email('Enter a valid email address.').optional(),
    phone: z.string().optional(),
  }),
  fields: [
    {
      type: 'radio',
      name: 'contact',
      label: 'Contact by',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
      ],
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email',
      dependencies: [
        {
          conditions: [
            { field: 'contact', operator: 'equals', value: 'email' },
          ],
          match: 'all',
          effect: 'show',
        },
      ],
    },
    {
      type: 'tel',
      name: 'phone',
      label: 'Phone',
      dependencies: [
        {
          conditions: [
            { field: 'contact', operator: 'equals', value: 'phone' },
          ],
          match: 'all',
          effect: 'show',
        },
      ],
    },
  ],
});

/** Choosing an option swaps which dependent field is shown. */
export const ConditionalFields: Story = {
  args: { definition: conditional as never, onSubmit: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('textbox', { name: 'Email' })).toBeNull();
    await userEvent.click(canvas.getByRole('radio', { name: 'Email' }));
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('radio', { name: 'Phone' }));
    await expect(
      await canvas.findByRole('textbox', { name: 'Phone' }),
    ).toBeVisible();
    await expect(canvas.queryByRole('textbox', { name: 'Email' })).toBeNull();
  },
};

const TAKEN = new Set(['admin', 'root', 'ada']);

/** Pretends to ask a server whether a handle is free; aborts when told to. */
const checkHandle = (value: unknown, { signal }: { signal: AbortSignal }) =>
  new Promise<string | undefined>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        resolve(
          TAKEN.has(String(value).toLowerCase())
            ? 'That handle is taken.'
            : undefined,
        ),
      600,
    );
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

const profile = defineForm({
  schema: z.object({
    handle: z
      .string()
      .min(3, 'Use at least 3 characters.')
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and dashes.'),
  }),
  fields: [
    {
      type: 'text',
      name: 'handle',
      label: 'Handle',
      description: 'Try ada, admin or root to see a refusal.',
      props: { pattern: '[a-z0-9-]+' },
      asyncValidation: { check: checkHandle, debounceMs: 400, timeoutMs: 5000 },
    },
  ],
});

/**
 * An async check: debounced while typing, "Validating…" with the field
 * disabled while it runs, and run at once on submit, which waits for it.
 */
export const AsyncValidation: Story = {
  args: { definition: profile as never, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('textbox', { name: 'Handle' });
    await userEvent.type(handle, 'ada');
    await expect(await canvas.findByText('Validating…')).toBeVisible();
    await expect(
      await canvas.findByText('That handle is taken.', {}, { timeout: 3000 }),
    ).toBeVisible();
    await userEvent.clear(handle);
    await userEvent.type(handle, 'grace');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(
      () => expect(args.onSubmit).toHaveBeenCalledWith({ handle: 'grace' }),
      { timeout: 3000 },
    );
  },
};

const account = defineForm({
  schema: z.object({
    name: z.string().min(1, 'Enter a name.'),
    phone: z.string().min(1, 'Enter a phone number.'),
    fax: z.string().optional(),
    retention: z.enum(['30', '90', '365']).optional(),
    audit: z.boolean().optional(),
  }),
  groups: [
    { id: 'contact', title: 'Contact', description: 'How we reach you.' },
    {
      id: 'advanced',
      title: 'Advanced',
      collapsible: true,
      defaultOpen: false,
    },
  ],
  fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'tel', name: 'phone', label: 'Phone', group: 'contact' },
    { type: 'tel', name: 'fax', label: 'Fax', group: 'contact' },
    {
      type: 'select',
      name: 'retention',
      label: 'Keep data for',
      group: 'advanced',
      options: [
        { value: '30', label: '30 days' },
        { value: '90', label: '90 days' },
        { value: '365', label: 'A year' },
      ],
      props: { clearable: true },
    },
    { type: 'switch', name: 'audit', label: 'Audit log', group: 'advanced' },
  ],
});

/** A plain group and a collapsible one that starts folded. */
export const Groups: Story = {
  args: { definition: account as never, onSubmit: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Contact' })).toBeVisible();
    const toggle = canvas.getByRole('button', { name: 'Advanced' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The panel fades in; wait for it rather than catching it mid-transition.
    await waitFor(() =>
      expect(canvas.getByRole('switch', { name: 'Audit log' })).toBeVisible(),
    );
  },
};

const folded = defineForm({
  schema: z.object({
    name: z.string().min(1, 'Enter a name.'),
    phone: z.string().min(1, 'Enter a phone number.'),
  }),
  groups: [
    { id: 'contact', title: 'Contact', collapsible: true, defaultOpen: false },
  ],
  fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'tel', name: 'phone', label: 'Phone', group: 'contact' },
  ],
});

/** A failed submit unfolds the group that holds the error and focuses the field. */
export const FoldedGroupWithError: Story = {
  args: {
    definition: folded as never,
    onSubmit: fn(),
    initialValues: { name: 'Ada' } as never,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(canvas.getByText('Enter a phone number.')).toBeVisible(),
    );
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Phone' })).toHaveFocus(),
    );
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

const SKILLS = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'writing', label: 'Writing' },
  { value: 'ops', label: 'Operations' },
  { value: 'data', label: 'Data' },
];

const COUNTRIES = Array.from({ length: 3000 }, (_, index) => ({
  value: `c${index}`,
  label: `Country ${index + 1}`,
}));

const lists = defineForm({
  schema: z.object({
    team: z.enum(['design', 'research', 'writing', 'ops', 'data']).optional(),
    skills: z
      .array(z.enum(['design', 'research', 'writing', 'ops', 'data']))
      .min(1, 'Pick at least one skill.')
      .max(3),
    topics: z.array(z.string().max(20)).max(5),
    country: z.string().optional(),
    trip: z.object({ from: z.string(), to: z.string().optional() }).optional(),
  }),
  fields: [
    {
      type: 'select',
      name: 'team',
      label: 'Team',
      options: SKILLS,
      props: { searchable: true, clearable: true, placeholder: 'Find a team' },
    },
    {
      type: 'multiselect',
      name: 'skills',
      label: 'Skills',
      description: 'Up to three.',
      options: SKILLS,
      props: { placeholder: 'Add skills', clearable: true, maxSelected: 3 },
    },
    {
      type: 'tags',
      name: 'topics',
      label: 'Topics',
      description: 'Enter or a comma adds a topic.',
      props: { placeholder: 'Add a topic', maxTags: 5, maxLength: 20 },
    },
    {
      type: 'select',
      name: 'country',
      label: 'Country',
      options: COUNTRIES,
      props: {
        searchable: true,
        virtualize: { threshold: 200 },
        placeholder: 'Search 3,000 countries',
      },
    },
    { type: 'date-range', name: 'trip', label: 'Trip' },
  ],
});

/** Searchable and clearable select, multiselect, tags, a windowed list and a date range. */
export const ListFields: Story = {
  args: { definition: lists as never, onSubmit: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(
      await canvas.findByText('Pick at least one skill.'),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('combobox', { name: 'Skills' }));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Design' }),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Topics' }),
      'roadmap{Enter}',
    );

    await userEvent.click(canvas.getByRole('combobox', { name: 'Country' }));
    const rendered = await screen.findAllByRole('option');
    await expect(rendered.length).toBeLessThan(60);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ skills: ['design'], topics: ['roadmap'] }),
      ),
    );
    // Checked at rest, once every option list has finished closing.
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  },
};

// `#3366cc` in this story is a field value a person picked, not a styling colour.
const marked = defineForm({
  schema: z.object({
    name: z.string().min(1),
    due: z.string().min(1, 'Choose a day.'),
    accent: z.string().optional(),
    nickname: z.string().optional(),
  }),
  fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'date', name: 'due', label: 'Due' },
    { type: 'color', name: 'accent', label: 'Accent colour' },
    { type: 'text', name: 'nickname', label: 'Nickname' },
  ],
});

/**
 * Required fields carry an asterisk; a date picker, which cannot be
 * `aria-required`, says "Required" instead. An optional colour can be cleared.
 */
export const RequiredAndColour: Story = {
  args: {
    definition: marked as never,
    onSubmit: fn(),
    initialValues: { accent: '#3366cc' } as never,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('#3366CC')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear Accent colour' }),
    );
    await expect(canvas.getByText('None chosen')).toBeVisible();
  },
};
