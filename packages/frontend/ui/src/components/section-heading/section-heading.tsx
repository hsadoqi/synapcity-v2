import { cn } from '@synapcity/frontend-ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function SectionHeading({
  id,
  icon: Icon,
  children,
  className,
}: {
  id?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        'flex items-center gap-2 text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {children}
    </h2>
  );
}
