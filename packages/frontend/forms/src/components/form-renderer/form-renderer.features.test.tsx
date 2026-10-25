import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { AsyncFieldValidation } from '../../types';
import { defineForm } from '../../utils';
import { FormRenderer } from './form-renderer';

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () =>
  act(async () => {
    fireEvent.submit(
      screen.getByRole('button', { name: 'Save' }).closest('form')!,
    );
  });
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

afterEach(() => vi.useRealTimers());

describe('FormRenderer async validation', () => {
  const handleSchema = z.object({
    handle: z.string().min(3, 'Use at least 3 characters.'),
  });

  /** A check the test answers by hand. */
  function manual(extra: Partial<AsyncFieldValidation> = {}) {
    const calls: { value: unknown; answer: (message?: string) => void }[] = [];
    const check = vi.fn(
      (value: unknown) =>
        new Promise<string | undefined>((resolve) => {
          calls.push({ value, answer: resolve });
        }),
    );
    const definition = defineForm({
      schema: handleSchema,
      fields: [
        {
          type: 'text',
          name: 'handle',
          label: 'Handle',
          asyncValidation: { check, debounceMs: 300, ...extra },
        },
      ],
    });
    return { definition, check, calls };
  }

  const handle = () => screen.getByLabelText('Handle') as HTMLInputElement;
  const status = () => document.querySelector('[role="status"]');

  it('checks once after typing stops, saying Validating while the field stays editable', async () => {
    vi.useFakeTimers();
    const { definition, calls } = manual();
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);
    handle().focus();

    type('Handle', 'ad');
    type('Handle', 'ada');
    type('Handle', 'adal');
    await wait(299);
    expect(calls).toHaveLength(0);
    await wait(1);

    expect(calls.map((call) => call.value)).toEqual(['adal']);
    expect(status()?.textContent).toBe('Validating…');
    // A background check never takes the field away from someone typing.
    expect(handle().disabled).toBe(false);
    expect(document.activeElement).toBe(handle());

    await act(async () => calls[0]?.answer('That handle is taken.'));

    expect(screen.getByText('That handle is taken.')).toBeTruthy();
    expect(handle().getAttribute('aria-invalid')).toBe('true');
    expect(handle().disabled).toBe(false);
    expect(status()?.textContent).toBe('');
    expect(document.activeElement).toBe(handle());
  });

  it('does not check a value the schema refuses or an empty one', async () => {
    vi.useFakeTimers();
    const { definition, check } = manual();
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    type('Handle', 'ab');
    await wait(1000);
    type('Handle', '');
    await wait(1000);

    expect(check).not.toHaveBeenCalled();
  });

  it('says a custom validating message', async () => {
    vi.useFakeTimers();
    const { definition } = manual({
      messages: { validating: 'Checking the handle…' },
    });
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    type('Handle', 'ada');
    await wait(300);

    expect(status()?.textContent).toBe('Checking the handle…');
  });

  it('locks every field and the submit button while submit-time checks and the handler run', async () => {
    const { definition, calls } = manual();
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    const save = screen.getByRole('button', {
      name: 'Save',
    }) as HTMLButtonElement;

    type('Handle', 'ada');
    await submit();
    expect(handle().disabled).toBe(true);
    expect(save.disabled).toBe(true);
    expect(save.getAttribute('aria-busy')).toBe('true');

    await act(async () => calls[0]?.answer(undefined));
    expect(onSubmit).toHaveBeenCalledWith({ handle: 'ada' });
    expect(handle().disabled).toBe(true);

    await act(async () => finish());
    expect(handle().disabled).toBe(false);
    expect(save.disabled).toBe(false);
  });

  it('disables the field while a check runs, and returns focus, only when disableWhileValidating is set', async () => {
    vi.useFakeTimers();
    const { definition, calls } = manual({ disableWhileValidating: true });
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);
    handle().focus();

    type('Handle', 'ada');
    await wait(300);
    expect(status()?.textContent).toBe('Validating…');
    expect(handle().disabled).toBe(true);

    await act(async () => calls[0]?.answer(undefined));

    expect(handle().disabled).toBe(false);
    expect(document.activeElement).toBe(handle());
  });

  it('gives a check only the values of visible fields', async () => {
    const check = vi.fn(async () => undefined);
    const definition = defineForm({
      schema: z.object({
        custom: z.boolean().optional(),
        secret: z.string().optional(),
        handle: z.string().min(3),
      }),
      fields: [
        { type: 'switch', name: 'custom', label: 'Custom' },
        {
          type: 'text',
          name: 'secret',
          label: 'Secret',
          dependencies: [
            {
              match: 'all',
              effect: 'show',
              conditions: [
                { field: 'custom', operator: 'equals', value: true },
              ],
            },
          ],
        },
        {
          type: 'text',
          name: 'handle',
          label: 'Handle',
          asyncValidation: { check },
        },
      ],
    });
    render(
      <FormRenderer
        definition={definition}
        onSubmit={vi.fn()}
        initialValues={{ secret: 'stale' }}
      />,
    );

    type('Handle', 'ada');
    await submit();

    const { values } = (
      check.mock.calls[0] as unknown as [
        unknown,
        { values: Record<string, unknown> },
      ]
    )[1];
    expect(values).toEqual(expect.objectContaining({ handle: 'ada' }));
    expect('secret' in values).toBe(false);
  });

  it('keeps the fields of a form without async checks editable while it submits', async () => {
    const plain = defineForm({
      schema: z.object({ name: z.string().min(1) }),
      fields: [{ type: 'text', name: 'name', label: 'Name' }],
    });
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<FormRenderer definition={plain} onSubmit={onSubmit} />);

    type('Name', 'Ada');
    await submit();

    expect((screen.getByLabelText('Name') as HTMLInputElement).disabled).toBe(
      false,
    );
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await act(async () => finish());
  });

  it('never locks the form for a submit the schema refuses', async () => {
    const { definition } = manual();
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    type('Handle', 'a');
    await submit();

    expect(handle().disabled).toBe(false);
    expect(document.activeElement).toBe(handle());
  });

  it('unlocks and focuses the field once a submit-time check refuses', async () => {
    const { definition, calls } = manual();
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    type('Handle', 'ada');
    await submit();
    expect(handle().disabled).toBe(true);
    await act(async () => calls[0]?.answer('That handle is taken.'));

    expect(handle().disabled).toBe(false);
    expect(document.activeElement).toBe(handle());
  });

  it('posts the values a server action was submitted with, though the fields lock during the check', async () => {
    const { definition, calls } = manual();
    const action = vi.fn();
    render(<FormRenderer definition={definition} action={action} />);

    type('Handle', 'ada');
    await submit();
    expect(handle().disabled).toBe(true);
    await act(async () => calls[0]?.answer(undefined));

    expect(action).toHaveBeenCalledTimes(1);
    expect((action.mock.calls[0]?.[0] as FormData).get('handle')).toBe('ada');
  });

  it('runs the check at once on submit, waits for it, then submits an accepted value', async () => {
    const { definition, calls } = manual();
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);

    type('Handle', 'ada');
    await submit();
    expect(calls).toHaveLength(1);
    expect(onSubmit).not.toHaveBeenCalled();

    await act(async () => calls[0]?.answer(undefined));

    expect(onSubmit).toHaveBeenCalledWith({ handle: 'ada' });
  });

  it('blocks the submit, shows the refusal and focuses the field when the check refuses', async () => {
    const { definition, calls } = manual();
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);

    type('Handle', 'ada');
    await submit();
    await act(async () => calls[0]?.answer('That handle is taken.'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('That handle is taken.')).toBeTruthy();
    expect(document.activeElement).toBe(handle());
  });

  it('shows the schema rule, not an older async refusal, once the value breaks it', async () => {
    const { definition, calls } = manual();
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    type('Handle', 'ada');
    await submit();
    await act(async () => calls[0]?.answer('That handle is taken.'));
    type('Handle', 'a');
    await submit();

    expect(screen.queryByText('That handle is taken.')).toBeNull();
    expect(screen.getByText('Use at least 3 characters.')).toBeTruthy();
  });

  it('blocks the submit when the check fails, and submits once a retry succeeds', async () => {
    let attempts = 0;
    const onSubmit = vi.fn();
    const definition = defineForm({
      schema: handleSchema,
      fields: [
        {
          type: 'text',
          name: 'handle',
          label: 'Handle',
          asyncValidation: {
            debounceMs: 10_000,
            check: async () => {
              attempts += 1;
              if (attempts === 1) throw new Error('database down');
              return undefined;
            },
          },
        },
      ],
    });
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);

    type('Handle', 'ada');
    await submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Could not check this. Try again.')).toBeTruthy();
    expect(screen.queryByText(/database/)).toBeNull();

    await submit();
    expect(onSubmit).toHaveBeenCalledWith({ handle: 'ada' });
  });

  it('blocks a server action while the check refuses the value', async () => {
    const { definition, calls } = manual();
    const action = vi.fn();
    render(<FormRenderer definition={definition} action={action} />);

    type('Handle', 'ada');
    await submit();
    await act(async () => calls[0]?.answer('That handle is taken.'));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText('That handle is taken.')).toBeTruthy();
  });

  it('does not check a hidden field on submit', async () => {
    const check = vi.fn(async () => 'never');
    const definition = defineForm({
      schema: z.object({
        custom: z.boolean().optional(),
        handle: z.string().optional(),
      }),
      fields: [
        { type: 'switch', name: 'custom', label: 'Custom handle' },
        {
          type: 'text',
          name: 'handle',
          label: 'Handle',
          asyncValidation: { check },
          dependencies: [
            {
              match: 'all',
              effect: 'show',
              conditions: [
                { field: 'custom', operator: 'equals', value: true },
              ],
            },
          ],
        },
      ],
    });
    const onSubmit = vi.fn();
    render(
      <FormRenderer
        definition={definition}
        onSubmit={onSubmit}
        initialValues={{ handle: 'ada' }}
      />,
    );

    await submit();

    expect(check).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('FormRenderer groups', () => {
  const contactSchema = z.object({
    name: z.string().min(1, 'Enter a name.'),
    phone: z.string().min(1, 'Enter a phone number.'),
    fax: z.string().optional(),
    notes: z.string().optional(),
  });

  const withGroup = (group: { collapsible?: boolean; defaultOpen?: boolean }) =>
    defineForm({
      schema: contactSchema,
      groups: [
        {
          id: 'contact',
          title: 'Contact details',
          description: 'How we reach you.',
          ...group,
        },
      ],
      fields: [
        { type: 'text', name: 'name', label: 'Name' },
        { type: 'tel', name: 'phone', label: 'Phone', group: 'contact' },
        { type: 'tel', name: 'fax', label: 'Fax', group: 'contact' },
        { type: 'textarea', name: 'notes', label: 'Notes' },
      ],
    });

  it('renders a group as a fieldset named by its title and described by its description', () => {
    render(<FormRenderer definition={withGroup({})} onSubmit={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Contact details' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group.contains(screen.getByLabelText('Phone'))).toBe(true);
    expect(group.contains(screen.getByLabelText('Name'))).toBe(false);
    const description = document.getElementById(
      group.getAttribute('aria-describedby')!,
    );
    expect(description?.textContent).toBe('How we reach you.');
  });

  it('keeps fields in definition order around the group', () => {
    render(<FormRenderer definition={withGroup({})} onSubmit={vi.fn()} />);
    const labels = [...document.querySelectorAll('label')].map(
      (label) => label.textContent,
    );
    expect(labels).toEqual(['Name', 'Phone', 'Fax', 'Notes']);
  });

  it('folds a collapsible group and still submits its values', async () => {
    const onSubmit = vi.fn();
    render(
      <FormRenderer
        definition={withGroup({ collapsible: true })}
        onSubmit={onSubmit}
        initialValues={{ name: 'Ada' }}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Contact details' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    type('Phone', '555');

    await act(async () => fireEvent.click(toggle));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByLabelText('Phone').closest('[hidden]')).not.toBeNull();

    await submit();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada', phone: '555' }),
    );
  });

  it('unfolds a folded group holding an error on submit and focuses the field', async () => {
    const onSubmit = vi.fn();
    render(
      <FormRenderer
        definition={withGroup({ collapsible: true, defaultOpen: false })}
        onSubmit={onSubmit}
        initialValues={{ name: 'Ada' }}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Contact details' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Enter a phone number.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Phone'));
  });

  it('says how many errors a folded group holds on its toggle', async () => {
    render(
      <FormRenderer
        definition={withGroup({ collapsible: true })}
        onSubmit={vi.fn()}
        initialValues={{ name: 'Ada' }}
      />,
    );
    await submit();
    const toggle = screen.getByRole('button', { name: /Contact details/ });

    await act(async () => fireEvent.click(toggle));

    expect(toggle.textContent).toContain('(1 error)');
  });

  it('unfolds a folded group while a server refusal names one of its fields', () => {
    render(
      <FormRenderer
        definition={withGroup({ collapsible: true, defaultOpen: false })}
        action={vi.fn()}
        state={{ error: 'That number is blocked.', fields: ['phone'] }}
      />,
    );

    expect(
      screen
        .getByRole('button', { name: 'Contact details' })
        .getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('leaves out a group whose fields are all hidden', () => {
    const definition = defineForm({
      schema: z.object({
        extra: z.boolean().optional(),
        detail: z.string().optional(),
      }),
      groups: [{ id: 'more', title: 'More' }],
      fields: [
        { type: 'switch', name: 'extra', label: 'Show more' },
        {
          type: 'text',
          name: 'detail',
          label: 'Detail',
          group: 'more',
          dependencies: [
            {
              match: 'all',
              effect: 'show',
              conditions: [{ field: 'extra', operator: 'equals', value: true }],
            },
          ],
        },
      ],
    });
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    expect(screen.queryByRole('group', { name: 'More' })).toBeNull();
  });
});

describe('FormRenderer required marker', () => {
  const definition = defineForm({
    schema: z.object({
      name: z.string().min(1),
      due: z.string().min(1),
      nickname: z.string().optional(),
    }),
    fields: [
      { type: 'text', name: 'name', label: 'Name' },
      { type: 'date', name: 'due', label: 'Due' },
      { type: 'text', name: 'nickname', label: 'Nickname' },
    ],
  });

  it('puts a hidden asterisk beside a required label, leaving the label text alone', () => {
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);

    const label = screen.getByText('Name', { selector: 'label' });
    expect(label.textContent).toBe('Name');
    const marker = label.parentElement?.querySelector('[aria-hidden="true"]');
    expect(marker?.textContent).toBe('*');
    expect(
      screen
        .getByText('Nickname', { selector: 'label' })
        .parentElement?.querySelector('[aria-hidden="true"]'),
    ).toBeNull();
  });

  it('says Required through aria-describedby for a control that cannot be aria-required', () => {
    render(
      <FormRenderer
        definition={definition}
        onSubmit={vi.fn()}
        messages={{ requiredHint: 'Needed' }}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Due/ });
    const ids = trigger.getAttribute('aria-describedby')?.split(' ') ?? [];
    const spoken = ids.map((id) => document.getElementById(id)?.textContent);
    expect(spoken).toContain('Needed');
    expect(
      screen.getByLabelText('Name').getAttribute('aria-describedby'),
    ).toBeNull();
    expect(screen.getByLabelText('Name').getAttribute('aria-required')).toBe(
      'true',
    );
  });
});

describe('FormRenderer list and range fields', () => {
  const definition = defineForm({
    schema: z.object({
      skills: z.array(z.enum(['design', 'ops'])).min(1, 'Pick a skill.'),
      topics: z.array(z.string()),
      trip: z
        .object({ from: z.string(), to: z.string().optional() })
        .optional(),
    }),
    fields: [
      {
        type: 'multiselect',
        name: 'skills',
        label: 'Skills',
        options: [
          { value: 'design', label: 'Design' },
          { value: 'ops', label: 'Operations' },
        ],
      },
      { type: 'tags', name: 'topics', label: 'Topics' },
      { type: 'date-range', name: 'trip', label: 'Trip' },
    ],
  });

  it('starts lists empty, refuses an empty required list and submits the values', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);

    await submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Pick a skill.')).toBeTruthy();

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Skills' }), {
      key: 'ArrowDown',
    });
    await act(async () =>
      fireEvent.click(await screen.findByRole('option', { name: 'Design' })),
    );
    // A multiselect stays open after a pick; close it like a person would.
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Skills' }), {
      key: 'Escape',
    });
    type('Topics', 'research');
    fireEvent.keyDown(screen.getByLabelText('Topics'), { key: 'Enter' });
    await submit();

    expect(onSubmit).toHaveBeenCalledWith({
      skills: ['design'],
      topics: ['research'],
    });
  });

  it('posts list and range values to a server action under their names', async () => {
    const action = vi.fn();
    render(
      <FormRenderer
        definition={definition}
        action={action}
        initialValues={{
          skills: ['ops', 'design'],
          topics: ['a', 'b'],
          trip: { from: '2026-01-01', to: '2026-01-05' },
        }}
      />,
    );

    await submit();

    const data = action.mock.calls[0]?.[0] as FormData;
    expect(data.getAll('skills')).toEqual(['ops', 'design']);
    expect(data.getAll('topics')).toEqual(['a', 'b']);
    expect(data.get('trip.from')).toBe('2026-01-01');
    expect(data.get('trip.to')).toBe('2026-01-05');
  });
});

describe('FormRenderer focus requests', () => {
  const definition = defineForm({
    schema: z.object({
      frozen: z.boolean().optional(),
      note: z.string().min(1, 'Enter a note.'),
    }),
    fields: [
      { type: 'switch', name: 'frozen', label: 'Frozen' },
      {
        type: 'text',
        name: 'note',
        label: 'Note',
        dependencies: [
          {
            match: 'all',
            effect: 'disable',
            conditions: [{ field: 'frozen', operator: 'equals', value: true }],
          },
        ],
      },
    ],
  });

  it('does not steal focus later for a field that was disabled when its error came up', async () => {
    render(
      <FormRenderer
        definition={definition}
        onSubmit={vi.fn()}
        initialValues={{ frozen: true }}
      />,
    );
    await submit();
    expect(screen.getByText('Enter a note.')).toBeTruthy();

    const toggle = screen.getByRole('switch', { name: 'Frozen' });
    toggle.focus();
    await act(async () => fireEvent.click(toggle));

    expect((screen.getByLabelText('Note') as HTMLInputElement).disabled).toBe(
      false,
    );
    expect(document.activeElement).toBe(toggle);
  });
});
