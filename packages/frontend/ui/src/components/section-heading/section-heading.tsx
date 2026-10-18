import type { LucideIcon } from 'lucide-react';

export function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {children}
    </h2>
  );
}
