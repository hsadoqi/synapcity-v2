import { Separator } from '@synapcity/frontend-ui/core/separator';

export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}
