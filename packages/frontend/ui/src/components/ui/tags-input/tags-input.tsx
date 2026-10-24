'use client';

import * as React from 'react';
import { XIcon } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import { cn } from '@synapcity/frontend-ui/lib/utils';

export interface TagsInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'name'
> {
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (tags: string[]) => void;
  /** Renders one hidden input per tag under this name, for a plain form post. */
  readonly name?: string;
  readonly maxTags?: number;
  /** The longest tag accepted; longer text stays in the input to be edited. */
  readonly maxLength?: number;
  /** Keep a tag that repeats one already added (compared case-insensitively). */
  readonly allowDuplicates?: boolean;
  /** The remove button's accessible name for a tag. Defaults to `Remove <tag>`. */
  readonly removeLabel?: (tag: string) => string;
}

const SEPARATORS = /[,\n]/;

/** Tags from typed or pasted text: split on commas and new lines, trimmed, empty parts dropped. */
export function parseTags(text: string): string[] {
  return text
    .split(SEPARATORS)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

interface AddResult {
  readonly tags: string[];
  readonly added: string[];
  /** Text not added because it was too long; it stays in the input. */
  readonly rejected: string[];
}

/** Adds candidate tags to a list, honouring the limit, the length cap and duplicates. */
export function addTags(
  current: readonly string[],
  candidates: readonly string[],
  {
    maxTags,
    maxLength,
    allowDuplicates = false,
  }: Pick<TagsInputProps, 'maxTags' | 'maxLength' | 'allowDuplicates'>,
): AddResult {
  const tags = [...current];
  const seen = new Set(current.map((tag) => tag.toLowerCase()));
  const added: string[] = [];
  const rejected: string[] = [];
  for (const candidate of candidates) {
    if (maxLength !== undefined && candidate.length > maxLength) {
      rejected.push(candidate);
      continue;
    }
    if (!allowDuplicates && seen.has(candidate.toLowerCase())) continue;
    if (maxTags !== undefined && tags.length >= maxTags) break;
    tags.push(candidate);
    seen.add(candidate.toLowerCase());
    added.push(candidate);
  }
  return { tags, added, rejected };
}

/**
 * A text input that turns what is typed into a list of tags. Enter or a comma
 * adds the text, pasting a comma or line separated list adds each part,
 * leaving the input adds what is left in it, and Backspace in the empty input
 * removes the last tag. Each tag has a remove button, and every change is
 * announced. Controlled with `value` and `onValueChange`, or uncontrolled with
 * `defaultValue`. `id`, `aria-*` and `ref` go to the text input.
 */
function TagsInput({
  value,
  defaultValue = [],
  onValueChange,
  name,
  maxTags,
  maxLength,
  allowDuplicates,
  removeLabel = (tag) => `Remove ${tag}`,
  className,
  disabled,
  placeholder,
  onKeyDown,
  onBlur,
  onPaste,
  ref,
  ...inputProps
}: TagsInputProps) {
  const controlled = value !== undefined;
  const [own, setOwn] = React.useState<readonly string[]>(defaultValue);
  const tags = controlled ? value : own;
  const [draft, setDraft] = React.useState('');
  const [announcement, setAnnouncement] = React.useState('');
  const input = React.useRef<HTMLInputElement | null>(null);
  // The caller's ref names the text input.
  React.useImperativeHandle(ref, () => input.current as HTMLInputElement, []);
  const full = maxTags !== undefined && tags.length >= maxTags;

  const update = (next: string[]) => {
    if (!controlled) setOwn(next);
    onValueChange?.(next);
  };

  const commit = (text: string) => {
    const candidates = parseTags(text);
    if (candidates.length === 0) {
      setDraft('');
      return;
    }
    const result = addTags(tags, candidates, {
      maxTags,
      maxLength,
      allowDuplicates,
    });
    if (result.added.length > 0) {
      update(result.tags);
      setAnnouncement(`Added ${result.added.join(', ')}`);
    } else if (full) {
      setAnnouncement(`You can add up to ${maxTags} tags`);
      return;
    }
    setDraft(result.rejected.join(', '));
  };

  const remove = (index: number) => {
    const tag = tags[index];
    if (tag === undefined) return;
    update(tags.filter((_, position) => position !== index));
    setAnnouncement(`Removed ${tag}`);
    input.current?.focus();
  };

  return (
    <div
      data-slot="tags-input"
      data-disabled={disabled || undefined}
      className={cn(
        'flex min-h-7 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-1.5 py-0.5 text-sm transition-colors duration-150 ease-out focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 has-aria-invalid:border-destructive has-aria-invalid:ring-2 has-aria-invalid:ring-destructive/20 data-disabled:cursor-not-allowed data-disabled:opacity-50 md:text-xs/relaxed pointer-coarse:min-h-11 pointer-coarse:text-touch-field dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40',
        className,
      )}
      onMouseDown={(event) => {
        // A press on the box's padding focuses the text input, like a native field.
        if (event.target === event.currentTarget) {
          event.preventDefault();
          input.current?.focus();
        }
      }}
    >
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          data-slot="tags-input-tag"
          className="flex h-5 items-center gap-0.5 rounded-sm bg-muted pl-1.5 text-xs font-medium whitespace-nowrap text-foreground"
        >
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={removeLabel(tag)}
            disabled={disabled}
            onClick={() => remove(index)}
          >
            <XIcon />
          </Button>
        </span>
      ))}
      <input
        {...inputProps}
        ref={input}
        type="text"
        data-slot="tags-input-input"
        value={draft}
        disabled={disabled}
        placeholder={tags.length === 0 ? placeholder : undefined}
        className="min-w-16 flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        onChange={(event) => {
          const text = event.target.value;
          // A typed comma ends a tag, like pressing Enter.
          if (SEPARATORS.test(text)) commit(text);
          else setDraft(text);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // The Enter that confirms an IME composition belongs to the IME.
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter' && draft.trim().length > 0) {
            // Enter in an empty input still submits the form.
            event.preventDefault();
            commit(draft);
          } else if (
            event.key === 'Backspace' &&
            draft.length === 0 &&
            tags.length > 0
          ) {
            event.preventDefault();
            remove(tags.length - 1);
          }
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented) return;
          const text = event.clipboardData.getData('text');
          if (SEPARATORS.test(text)) {
            event.preventDefault();
            commit(`${draft}${text}`);
          }
        }}
        onBlur={(event) => {
          if (draft.trim().length > 0) commit(draft);
          onBlur?.(event);
        }}
      />
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {name
        ? tags.map((tag, index) => (
            <input
              key={`${tag}-${index}`}
              type="hidden"
              name={name}
              value={tag}
            />
          ))
        : null}
    </div>
  );
}

export { TagsInput };
