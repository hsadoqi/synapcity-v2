import * as React from 'react';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@synapcity/frontend-ui/core/breadcrumb';
import { ShellLink } from '../../../providers/shell-navigation';

/** One level of the trail. The last item is the current page and takes no link. */
export type RootBreadcrumb = {
  label: string;
  href?: string;
  /**
   * What the crumb stands for, when it is a place the sidebar can switch to:
   * a collection (such as all Spaces) or one Space. The sidebar reads this to
   * pick the active context without parsing labels.
   */
  kind?: 'collection' | 'space';
};

/**
 * The trail to the current page. Below the sm breakpoint only the current page
 * shows, since the sidebar already shows where you are.
 */
export const BreadcrumbMenu = ({ items }: { items?: RootBreadcrumb[] }) => {
  if (!items?.length) {
    return <div className="min-w-0 flex-1" />;
  }

  const lastIndex = items.length - 1;

  return (
    <Breadcrumb aria-label="Breadcrumb" className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap text-sm">
        {items.map((item, index) => {
          const isLast = index === lastIndex;

          return (
            <React.Fragment key={`${item.href ?? ''}${item.label}`}>
              {index > 0 && (
                // Below sm only the current page shows, so no separator does.
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
              )}
              <BreadcrumbItem
                className={cn('min-w-0', !isLast && 'hidden sm:inline-flex')}
              >
                {isLast || !item.href ? (
                  <BreadcrumbPage className="truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="truncate"
                    render={<ShellLink href={item.href} />}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
