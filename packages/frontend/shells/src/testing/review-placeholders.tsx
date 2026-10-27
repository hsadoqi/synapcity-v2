import { FileText } from 'lucide-react';
import { cn } from '@synapcity/frontend-ui/lib/utils';

/**
 * Story content only, for visual review: an illustrative placeholder for
 * another resource shown in the contextual panel (a later slice), labelled so
 * it is never mistaken for a built component. Its layout follows the panel's
 * container, not the window.
 */

function PlaceholderLabel({ children }: { children: string }) {
  return (
    <span className="w-fit rounded-sm bg-muted px-1.5 py-0.5 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3'];

/** Another resource shown in the panel: compact, laid out by the panel's width. */
export function PlaceholderPanelResource() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <FileText aria-hidden="true" className="size-4 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          Related document
        </span>
      </div>
      <PlaceholderLabel>Placeholder resource view</PlaceholderLabel>
      <div className="grid grid-cols-1 gap-3 @lg/panel:grid-cols-2">
        {Array.from({ length: 6 }, (_, block) => (
          <div key={block} className="flex flex-col gap-2">
            {LINE_WIDTHS.slice(0, 4).map((width, line) => (
              <div
                key={line}
                className={cn('h-2 rounded-sm bg-muted', width)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
