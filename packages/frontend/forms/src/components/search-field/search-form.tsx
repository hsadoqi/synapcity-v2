'use client';

import { useId } from 'react';

import { Field, FieldLabel } from '@synapcity/frontend-ui/core/field';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { SearchInput } from './search-input';

export interface SearchFormProps extends Omit<
  React.ComponentProps<'form'>,
  'onSearch'
> {
  /**
   * Receives the trimmed query on submit; the app decides what searching
   * means, such as opening a command palette with the query.
   */
  onSearch?: (query: string) => void;
  /** Read by assistive tech; the label is visually hidden. */
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  /** The input's id. Defaults to one unique to this form. */
  inputId?: string;
}

/**
 * A search landmark holding one labelled search field, submitted as `q`. With
 * `onSearch` the page handles the query; without it, a form that has an
 * `action` submits natively (`GET action?q=…`, which also works before
 * hydration), and one with neither does nothing. It hides when a sidebar is
 * folded to icons.
 */
export function SearchForm({
  onSearch,
  label = 'Search',
  placeholder = 'Search…',
  defaultValue,
  inputId,
  className,
  onSubmit,
  ...props
}: SearchFormProps) {
  const generatedId = useId();
  const id = inputId ?? generatedId;

  return (
    <form
      role="search"
      className={cn('group-data-[collapsible=icon]:hidden', className)}
      {...props}
      onSubmit={(event) => {
        onSubmit?.(event);
        if (!onSearch) {
          if (!props.action) event.preventDefault();
          return;
        }
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('q');
        onSearch(typeof query === 'string' ? query.trim() : '');
      }}
    >
      <Field>
        <FieldLabel htmlFor={id} className="sr-only">
          {label}
        </FieldLabel>
        <SearchInput
          id={id}
          name="q"
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      </Field>
    </form>
  );
}
