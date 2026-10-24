import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

type CollectionPageHeaderProps = {
  title: string;
  intro: string;
};

/** The page's own heading and one-line intro; shared with the skeleton so loading never changes the words. */
function CollectionPageHeader({ title, intro }: CollectionPageHeaderProps) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
        {title}
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground text-pretty">
        {intro}
      </p>
    </header>
  );
}

const PAGE_CLASSES =
  'mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:py-12';

/** The frame of an index page: a heading and intro over whatever the page lists. */
export function CollectionPage({
  title,
  intro,
  children,
}: CollectionPageHeaderProps & { children: React.ReactNode }) {
  return (
    <div className={PAGE_CLASSES}>
      <CollectionPageHeader title={title} intro={intro} />
      {children}
    </div>
  );
}

const PLACEHOLDER_ROWS = 5;

/**
 * An index page while its items load: the real heading and intro, which do not
 * depend on the data, over placeholders laid out as the page lays out (the
 * carousel beside the pinned panel, a toolbar, then the list).
 */
export function CollectionPageSkeleton({
  title,
  intro,
  loadingLabel,
}: CollectionPageHeaderProps & { loadingLabel: string }) {
  return (
    <div aria-busy="true" className={PAGE_CLASSES}>
      <span className="sr-only" role="status">
        {loadingLabel}
      </span>
      <CollectionPageHeader title={title} intro={intro} />

      <div aria-hidden="true" className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-48 basis-11/12 shrink-0" />
            <Skeleton className="h-48 basis-56 shrink-0" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-7 flex-1 sm:max-w-sm" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
