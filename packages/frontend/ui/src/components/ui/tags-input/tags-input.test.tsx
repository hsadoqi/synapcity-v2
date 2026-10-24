import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  addTags,
  parseTags,
  TagsInput,
} from '@synapcity/frontend-ui/core/tags-input';

const field = () => screen.getByRole('textbox', { name: 'Topics' });
const type = (text: string) =>
  fireEvent.change(field(), { target: { value: text } });
const press = (key: string) => fireEvent.keyDown(field(), { key });

describe('parseTags', () => {
  it('splits on commas and new lines, trims, and drops empty parts', () => {
    expect(parseTags(' design, ,research\nops ,')).toEqual([
      'design',
      'research',
      'ops',
    ]);
    expect(parseTags('   ')).toEqual([]);
  });
});

describe('addTags', () => {
  it('skips duplicates case-insensitively unless allowed', () => {
    expect(addTags(['Design'], ['design', 'ops'], {}).tags).toEqual([
      'Design',
      'ops',
    ]);
    expect(
      addTags(['Design'], ['design'], { allowDuplicates: true }).tags,
    ).toEqual(['Design', 'design']);
  });

  it('stops at the limit and returns over-long text as rejected', () => {
    expect(addTags(['a'], ['b', 'c'], { maxTags: 2 })).toEqual({
      tags: ['a', 'b'],
      added: ['b'],
      rejected: [],
    });
    expect(addTags([], ['short', 'far too long'], { maxLength: 5 })).toEqual({
      tags: ['short'],
      added: ['short'],
      rejected: ['far too long'],
    });
  });
});

describe('TagsInput', () => {
  it('adds the typed text on Enter and announces it', () => {
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Topics" onValueChange={onValueChange} />);

    type('design');
    press('Enter');

    expect(onValueChange).toHaveBeenLastCalledWith(['design']);
    expect(screen.getByText('design')).toBeTruthy();
    expect(field()).toHaveProperty('value', '');
    expect(screen.getByRole('status').textContent).toBe('Added design');
  });

  it('does not add a tag on the Enter that confirms an IME composition', () => {
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Topics" onValueChange={onValueChange} />);

    type('にほん');
    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(field()).toHaveProperty('value', 'にほん');

    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith(['にほん']);
  });

  it('adds a tag when a comma is typed', () => {
    render(<TagsInput aria-label="Topics" />);

    type('ops,');

    expect(screen.getByText('ops')).toBeTruthy();
    expect(field()).toHaveProperty('value', '');
  });

  it('lets Enter in an empty input submit the form', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <TagsInput aria-label="Topics" />
      </form>,
    );

    const event = fireEvent.keyDown(field(), { key: 'Enter' });

    expect(event).toBe(true);
  });

  it('splits a pasted list into tags', () => {
    const onValueChange = vi.fn();
    render(<TagsInput aria-label="Topics" onValueChange={onValueChange} />);

    fireEvent.paste(field(), {
      clipboardData: { getData: () => 'a, b\nc' },
    });

    expect(onValueChange).toHaveBeenLastCalledWith(['a', 'b', 'c']);
  });

  it('adds what is left in the input on blur and then calls onBlur', () => {
    const onBlur = vi.fn();
    const onValueChange = vi.fn();
    render(
      <TagsInput
        aria-label="Topics"
        onBlur={onBlur}
        onValueChange={onValueChange}
      />,
    );

    type('pending');
    fireEvent.blur(field());

    expect(onValueChange).toHaveBeenLastCalledWith(['pending']);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('removes the last tag with Backspace in an empty input', () => {
    const onValueChange = vi.fn();
    render(
      <TagsInput
        aria-label="Topics"
        value={['a', 'b']}
        onValueChange={onValueChange}
      />,
    );

    press('Backspace');

    expect(onValueChange).toHaveBeenLastCalledWith(['a']);
  });

  it('removes a tag with its button and returns focus to the input', () => {
    const onValueChange = vi.fn();
    render(
      <TagsInput
        aria-label="Topics"
        defaultValue={['a', 'b']}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove a' }));

    expect(onValueChange).toHaveBeenLastCalledWith(['b']);
    expect(screen.queryByText('a')).toBeNull();
    expect(document.activeElement).toBe(field());
    expect(screen.getByRole('status').textContent).toBe('Removed a');
  });

  it('follows a controlled value and does not change it on its own', () => {
    const { rerender } = render(
      <TagsInput aria-label="Topics" value={['a']} />,
    );

    type('b');
    press('Enter');
    expect(screen.queryByText('b')).toBeNull();

    rerender(<TagsInput aria-label="Topics" value={['a', 'b']} />);
    expect(screen.getByText('b')).toBeTruthy();
  });

  it('announces the limit and keeps the text once maxTags is reached', () => {
    render(
      <TagsInput aria-label="Topics" defaultValue={['a', 'b']} maxTags={2} />,
    );

    type('c');
    press('Enter');

    expect(screen.queryByText('c')).toBeNull();
    expect(field()).toHaveProperty('value', 'c');
    expect(screen.getByRole('status').textContent).toBe(
      'You can add up to 2 tags',
    );
  });

  it('keeps over-long text in the input', () => {
    render(<TagsInput aria-label="Topics" maxLength={3} />);

    type('toolong');
    press('Enter');

    expect(field()).toHaveProperty('value', 'toolong');
  });

  it('renders a hidden input per tag for a form post', () => {
    const { container } = render(
      <TagsInput aria-label="Topics" name="topics" value={['a', 'b']} />,
    );

    const hidden = container.querySelectorAll('input[type="hidden"]');
    expect(
      [...hidden].map((input) => (input as HTMLInputElement).value),
    ).toEqual(['a', 'b']);
    expect((hidden[0] as HTMLInputElement).name).toBe('topics');
  });

  it('passes id, ARIA and ref to the text input and disables everything', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(
      <TagsInput
        id="topics"
        aria-label="Topics"
        aria-invalid
        aria-describedby="topics-help"
        ref={ref}
        disabled
        defaultValue={['a']}
      />,
    );

    expect(field().id).toBe('topics');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(field().getAttribute('aria-describedby')).toBe('topics-help');
    expect(ref.current).toBe(field());
    expect(field()).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Remove a' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('shows the placeholder only while there are no tags', () => {
    const { rerender } = render(
      <TagsInput aria-label="Topics" placeholder="Add a topic" value={[]} />,
    );
    expect(field().getAttribute('placeholder')).toBe('Add a topic');

    rerender(
      <TagsInput aria-label="Topics" placeholder="Add a topic" value={['a']} />,
    );
    expect(field().getAttribute('placeholder')).toBeNull();
  });
});
