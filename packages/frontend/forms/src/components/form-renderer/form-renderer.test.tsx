import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { defineForm } from '../../utils';
import { FormRenderer } from './form-renderer';

const schema = z.object({
  hasNote: z.boolean().optional(),
  note: z.string().min(1, 'Enter a note.'),
  name: z.string().min(1, 'Enter a name.'),
  email: z.string().optional(),
  nickname: z.string().nullable(),
});

const showWhenNote = [
  {
    match: 'all' as const,
    effect: 'show' as const,
    conditions: [
      { field: 'hasNote' as const, operator: 'equals' as const, value: true },
    ],
  },
];

const definition = defineForm({
  schema,
  fields: [
    { type: 'switch', name: 'hasNote', label: 'Add a note' },
    {
      type: 'textarea',
      name: 'note',
      label: 'Note',
      dependencies: showWhenNote,
    },
    { type: 'text', name: 'name', label: 'Name' },
    {
      type: 'email',
      name: 'email',
      label: 'Email',
      dependencies: [
        {
          match: 'all',
          effect: 'require',
          conditions: [{ field: 'hasNote', operator: 'equals', value: true }],
        },
      ],
    },
    { type: 'text', name: 'nickname', label: 'Nickname' },
  ],
});

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () =>
  act(async () => {
    fireEvent.submit(
      screen.getByRole('button', { name: 'Save' }).closest('form')!,
    );
  });
const toggleNote = () =>
  act(async () => {
    fireEvent.click(screen.getByRole('switch', { name: 'Add a note' }));
  });

describe('FormRenderer with onSubmit', () => {
  it('submits only visible values; a hidden required field does not block it', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    type('Name', 'Ada');
    await submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.name).toBe('Ada');
    expect('note' in values).toBe(false);
  });

  it('a nullable key that is not optional starts as null, so an untouched field validates', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    type('Name', 'Ada');
    await submit();
    expect(
      (onSubmit.mock.calls[0]?.[0] as Record<string, unknown>).nickname,
    ).toBeNull();
  });

  it('shows no error before a field is touched or the form is submitted', () => {
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);
    expect(screen.queryByText('Enter a name.')).toBeNull();
  });

  it('shows a schema error under the field, marks it and focuses it', async () => {
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);
    await submit();
    const name = screen.getByLabelText('Name');
    expect(screen.getByText('Enter a name.')).toBeTruthy();
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(name.getAttribute('aria-describedby')).toContain(
      screen.getByText('Enter a name.').id,
    );
    expect(document.activeElement).toBe(name);
  });

  it('focuses the first invalid field in definition order, even one shown later', async () => {
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);
    await toggleNote();
    await submit();
    expect(document.activeElement).toBe(screen.getByLabelText('Note'));
  });

  it('shows the required message for a field a dependency makes required', async () => {
    render(<FormRenderer definition={definition} onSubmit={vi.fn()} />);
    await toggleNote();
    type('Note', 'Hello');
    type('Name', 'Ada');
    await submit();
    expect(screen.getByText('This field is required')).toBeTruthy();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('a field shown by a later change appears and its value is submitted', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    expect(screen.queryByLabelText('Note')).toBeNull();
    await toggleNote();
    type('Note', 'Hello');
    type('Name', 'Ada');
    type('Email', 'ada@example.com');
    await submit();
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      note: 'Hello',
      hasNote: true,
    });
  });

  it('awaits an async onSubmit, stays pending until it settles, and ignores a second submit meanwhile', async () => {
    let settle = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    type('Name', 'Ada');
    await submit();
    await submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Save' }).getAttribute('aria-busy'),
    ).toBe('true');
    await act(async () => settle());
    expect(
      screen.getByRole('button', { name: 'Save' }).getAttribute('aria-busy'),
    ).toBeNull();
  });

  it('shows a form-level error when onSubmit rejects and keeps what was typed', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));
    render(
      <FormRenderer
        definition={definition}
        onSubmit={onSubmit}
        afterSubmit="clear"
      />,
    );
    type('Name', 'Ada');
    await submit();
    expect(screen.getByRole('alert').textContent).toBe(
      'Something went wrong. Try again.',
    );
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Ada',
    );
  });

  it('never puts the thrown error or a typed value in the message', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('secret-detail'));
    render(
      <FormRenderer
        definition={definition}
        onSubmit={onSubmit}
        messages={{ submitFailed: 'Could not save.' }}
      />,
    );
    type('Name', 'Ada');
    await submit();
    expect(screen.getByRole('alert').textContent).toBe('Could not save.');
  });

  it('keeps the values after a successful submit by default, and clears them with afterSubmit clear', async () => {
    const { unmount } = render(
      <FormRenderer definition={definition} onSubmit={vi.fn()} />,
    );
    type('Name', 'Ada');
    await submit();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Ada',
    );
    unmount();
    render(
      <FormRenderer
        definition={definition}
        onSubmit={vi.fn()}
        afterSubmit="clear"
        initialValues={{ name: '' }}
      />,
    );
    type('Name', 'Ada');
    await submit();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
  });

  it('seeds the fields from initialValues', () => {
    render(
      <FormRenderer
        definition={definition}
        onSubmit={vi.fn()}
        initialValues={{ name: 'Grace' }}
      />,
    );
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'Grace',
    );
  });

  it('shows a cancel button only when onCancel is given', () => {
    const onCancel = vi.fn();
    const { rerender } = render(
      <FormRenderer definition={definition} onSubmit={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    rerender(
      <FormRenderer
        definition={definition}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        cancelLabel="Discard"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('a definition with no fields renders only its buttons and submits an empty object', async () => {
    const onSubmit = vi.fn();
    render(
      <FormRenderer
        definition={defineForm({ schema: z.object({}), fields: [] })}
        onSubmit={onSubmit}
      />,
    );
    await submit();
    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it('two forms on one page never share an id', () => {
    const { container } = render(
      <>
        <FormRenderer definition={definition} onSubmit={vi.fn()} />
        <FormRenderer definition={definition} onSubmit={vi.fn()} />
      </>,
    );
    const ids = [...container.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('throws naming the type when a field type has no renderer', () => {
    const custom = defineForm({
      schema: z.object({ colour: z.string() }),
      fields: [{ type: 'custom:swatch', name: 'colour', label: 'Colour' }],
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<FormRenderer definition={custom} onSubmit={vi.fn()} />),
    ).toThrow('custom:swatch');
  });
});

describe('FormRenderer starting values', () => {
  it('starts a number or range field as undefined, not an empty string', async () => {
    const onSubmit = vi.fn();
    const numbers = defineForm({
      schema: z.object({
        volume: z.number().optional(),
        count: z.number().optional(),
      }),
      fields: [
        {
          type: 'range',
          name: 'volume',
          label: 'Volume',
          props: { min: 0, max: 10 },
        },
        { type: 'number', name: 'count', label: 'Count' },
      ],
    });
    render(<FormRenderer definition={numbers} onSubmit={onSubmit} />);
    await submit();
    expect(onSubmit).toHaveBeenCalledWith({});
  });
});

describe('FormRenderer cross-field rules', () => {
  const ruleSchema = z.object({
    change: z.boolean().optional(),
    password: z.string(),
    confirm: z.string(),
  });
  const shownWhenChanging = [
    {
      match: 'all' as const,
      effect: 'show' as const,
      conditions: [
        { field: 'change' as const, operator: 'equals' as const, value: true },
      ],
    },
  ];
  const ruled = defineForm({
    schema: ruleSchema,
    fields: [
      { type: 'switch', name: 'change', label: 'Change password' },
      {
        type: 'password',
        name: 'password',
        label: 'Password',
        props: { autoComplete: 'new-password' },
        dependencies: shownWhenChanging,
      },
      {
        type: 'password',
        name: 'confirm',
        label: 'Confirm',
        props: { autoComplete: 'new-password' },
        dependencies: shownWhenChanging,
      },
    ],
    rules: [
      {
        fields: ['password', 'confirm'],
        path: 'confirm',
        check: (values) =>
          values.password === values.confirm
            ? undefined
            : 'The passwords do not match.',
      },
    ],
  });

  it("shows a rule's message under its path field on submit", async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={ruled} onSubmit={onSubmit} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Change password' }));
    });
    type('Password', 'Secret1!');
    type('Confirm', 'Secret2!');
    await submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('The passwords do not match.')).toBeTruthy();
    expect(screen.getByLabelText('Confirm').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('does not run the rule while one of its fields is hidden', async () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={ruled} onSubmit={onSubmit} />);
    await submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('The passwords do not match.')).toBeNull();
  });
});

describe('FormRenderer with a server action', () => {
  it('keeps the form action, so it works before hydration', () => {
    render(<FormRenderer definition={definition} action={vi.fn()} />);
    const form = screen.getByRole('button', { name: 'Save' }).closest('form')!;
    expect(form.noValidate).toBe(true);
    expect(form.getAttribute('action')).not.toBeNull();
  });

  it('refuses invalid values in the browser without calling the action', async () => {
    const action = vi.fn();
    render(<FormRenderer definition={definition} action={action} />);
    await submit();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a name.')).toBeTruthy();
  });

  it('posts the form data of the visible fields to the action when valid', async () => {
    const action = vi.fn();
    render(<FormRenderer definition={definition} action={action} />);
    type('Name', 'Ada');
    await submit();
    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get('name')).toBe('Ada');
    expect(formData.has('note')).toBe(false);
  });

  it("shows the server's error and marks the fields it names", () => {
    render(
      <FormRenderer
        definition={definition}
        action={vi.fn()}
        state={{ error: 'That name is taken.', fields: ['name'] }}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('That name is taken.');
    const name = screen.getByLabelText('Name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(name.getAttribute('aria-describedby')).toContain(alert.id);
  });

  it('shows pending while the caller says the action is running', () => {
    render(<FormRenderer definition={definition} action={vi.fn()} pending />);
    expect(
      screen.getByRole('button', { name: 'Save' }).getAttribute('aria-busy'),
    ).toBe('true');
  });
});
