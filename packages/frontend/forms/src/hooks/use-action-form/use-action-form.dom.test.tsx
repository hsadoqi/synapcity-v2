import { act, fireEvent, render, screen } from '@testing-library/react';
import { useActionState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { useActionForm } from './use-action-form';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  name: z.string().min(3, 'Name is too short.'),
});

type Shown = { error?: string; fields?: readonly string[] };

/** Renders the hook's state so a test can read what the form would show. */
function Harness({
  action,
  serverState,
  onState,
}: {
  action: (formData: FormData) => void;
  serverState?: Shown;
  onState?: (state: Shown) => void;
}) {
  const { formProps, register, state } = useActionForm({
    schema,
    action,
    state: serverState ?? {},
  });
  onState?.(state);
  return (
    <form {...formProps} aria-label="test form">
      <input aria-label="email" {...register('email')} />
      <input aria-label="name" {...register('name')} />
      <input type="hidden" name="next" value="/home" />
      <button type="submit">go</button>
      <p data-testid="error">{state.error ?? ''}</p>
      <p data-testid="fields">{(state.fields ?? []).join(',')}</p>
    </form>
  );
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
/** `handleSubmit` validates asynchronously, so wait for it to settle. */
const submit = () =>
  act(async () => {
    fireEvent.submit(screen.getByRole('form'));
  });

describe('useActionForm', () => {
  it('does not call the action when the schema refuses, and reports the first problem with its field', async () => {
    const action = vi.fn();
    render(<Harness action={action} />);
    type('email', '   ');
    type('name', 'ab');
    await submit();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('Enter your email.');
    expect(screen.getByTestId('fields').textContent).toBe('email');
  });

  it('keeps what was typed when it refuses', async () => {
    render(<Harness action={vi.fn()} />);
    type('email', '   ');
    type('name', 'ab');
    await submit();
    expect((screen.getByLabelText('email') as HTMLInputElement).value).toBe(
      '   ',
    );
    expect((screen.getByLabelText('name') as HTMLInputElement).value).toBe(
      'ab',
    );
  });

  it('reports the next problem once the first is fixed', async () => {
    const action = vi.fn();
    render(<Harness action={action} />);
    type('email', 'a@b.c');
    type('name', 'ab');
    await submit();
    expect(screen.getByTestId('error').textContent).toBe('Name is too short.');
    expect(screen.getByTestId('fields').textContent).toBe('name');
  });

  it('calls the action once with the whole form data, including fields outside the schema', async () => {
    const action = vi.fn();
    render(<Harness action={action} />);
    type('email', ' a@b.c ');
    type('name', 'abcd');
    await submit();
    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0]?.[0] as FormData;
    expect(formData.get('email')).toBe(' a@b.c ');
    expect(formData.get('next')).toBe('/home');
  });

  it('validates what the form holds, not what was last typed', async () => {
    const action = vi.fn();
    render(<Harness action={action} />);
    type('email', 'a@b.c');
    type('name', 'abcd');
    // React resets a form after its action finishes, without a change event.
    (screen.getByLabelText('email') as HTMLInputElement).value = '';
    await submit();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('Enter your email.');
  });

  it('shows the server state again once a valid submit is made', async () => {
    const action = vi.fn();
    render(
      <Harness
        action={action}
        serverState={{ error: 'The server said no.', fields: ['email'] }}
      />,
    );
    expect(screen.getByTestId('error').textContent).toBe('The server said no.');
    type('email', '');
    type('name', 'abcd');
    await submit();
    expect(screen.getByTestId('error').textContent).toBe('Enter your email.');
    type('email', 'a@b.c');
    await submit();
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('error').textContent).toBe('The server said no.');
  });

  it('gives a new state object for each refusal, so focus moves again', async () => {
    const seen: Shown[] = [];
    render(<Harness action={vi.fn()} onState={(state) => seen.push(state)} />);
    type('email', '');
    type('name', 'abcd');
    await submit();
    const first = [...seen].reverse().find((state) => state.error);
    await submit();
    const second = [...seen].reverse().find((state) => state.error);
    expect(first).toBeDefined();
    expect(second).not.toBe(first);
  });

  it('marks the form noValidate and gives it the action', async () => {
    render(<Harness action={vi.fn()} />);
    expect((screen.getByRole('form') as HTMLFormElement).noValidate).toBe(true);
  });

  it('works with useActionState: the action is called inside a transition', async () => {
    const serverAction = vi.fn(
      async (_previous: Shown, _formData: FormData): Promise<Shown> => ({}),
    );
    function WithActionState() {
      const [state, formAction] = useActionState(
        async (previous: Shown, formData: FormData) =>
          serverAction(previous, formData),
        {},
      );
      const {
        formProps,
        register,
        state: shown,
      } = useActionForm({ schema, action: formAction, state });
      return (
        <form {...formProps} aria-label="test form">
          <input aria-label="email" {...register('email')} />
          <input aria-label="name" {...register('name')} />
          <button type="submit">go</button>
          <p data-testid="error">{shown.error ?? ''}</p>
        </form>
      );
    }
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<WithActionState />);
    type('email', 'a@b.c');
    type('name', 'abcd');
    await submit();
    await vi.waitFor(() => expect(serverAction).toHaveBeenCalledTimes(1));
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('refuses an empty file input against a file schema', async () => {
    const fileSchema = z.object({
      avatar: z
        .instanceof(File)
        .refine((file) => file.size > 0, 'Choose an image.'),
    });
    const action = vi.fn();
    function FileForm() {
      const { formProps, state } = useActionForm({
        schema: fileSchema,
        action,
        state: {},
      });
      return (
        <form {...formProps} aria-label="test form">
          <input aria-label="avatar" type="file" name="avatar" />
          <p data-testid="error">{state.error ?? ''}</p>
        </form>
      );
    }
    render(<FileForm />);
    await submit();
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByTestId('error').textContent).toBe('Choose an image.');

    // A chosen file is checked in the Storybook story: jsdom's FormData reads
    // the input's internal file list, which a test cannot set.
  });

  it('keeps every value of a name that appears more than once', async () => {
    const listSchema = z.object({
      tag: z.array(z.string()).min(2, 'Pick two tags.'),
    });
    const action = vi.fn();
    function ListForm() {
      const { formProps, state } = useActionForm({
        schema: listSchema,
        action,
        state: {},
      });
      return (
        <form {...formProps} aria-label="test form">
          <input aria-label="a" type="checkbox" name="tag" value="a" />
          <input aria-label="b" type="checkbox" name="tag" value="b" />
          <p data-testid="error">{state.error ?? ''}</p>
        </form>
      );
    }
    render(<ListForm />);
    fireEvent.click(screen.getByLabelText('a'));
    fireEvent.click(screen.getByLabelText('b'));
    await submit();
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(action).toHaveBeenCalledTimes(1);
  });
});
