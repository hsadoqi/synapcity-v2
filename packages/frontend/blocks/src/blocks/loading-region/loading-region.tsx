import { cn } from '@synapcity/frontend-ui/lib/utils';

export function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string;
  /** Layout only, merged over the default column with its `gap-10`. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy="true" className={cn('flex flex-col gap-10', className)}>
      <span className="sr-only" role="status">
        {label}
      </span>
      {children}
    </div>
  );
}
