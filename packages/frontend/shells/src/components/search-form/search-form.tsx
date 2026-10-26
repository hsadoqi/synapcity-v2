import { Search } from 'lucide-react';

import { Label } from '@synapcity/frontend-ui/core/label';
import { SidebarInput } from '@synapcity/frontend-ui/core/sidebar';
import { cn } from '@synapcity/frontend-ui/lib/utils';

/**
 * A search field for the sidebar. It hands the query to `onSearch` on submit
 * (the app decides what searching means, such as opening a command palette
 * with the query) and hides when the sidebar is folded to icons.
 */
export function SearchForm({
  onSearch,
  placeholder = 'Search…',
  className,
  onSubmit,
  ...props
}: Omit<React.ComponentProps<'form'>, 'onSearch'> & {
  onSearch?: (query: string) => void;
  placeholder?: string;
}) {
  return (
    <form
      role="search"
      className={cn('group-data-[collapsible=icon]:hidden', className)}
      onSubmit={(event) => {
        onSubmit?.(event);
        if (event.defaultPrevented && !onSearch) return;
        event.preventDefault();
        const query = new FormData(event.currentTarget).get('q');
        onSearch?.(typeof query === 'string' ? query.trim() : '');
      }}
      {...props}
    >
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          name="q"
          type="search"
          placeholder={placeholder}
          className="pl-8"
        />
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
        />
      </div>
    </form>
  );
}
