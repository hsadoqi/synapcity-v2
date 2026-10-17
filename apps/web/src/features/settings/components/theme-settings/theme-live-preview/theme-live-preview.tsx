import type { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { cn } from '@/lib/utils';
import { PanelLeft, FileText, Plus, ArrowUpRight, Check } from 'lucide-react';

export const ThemeLivePreview = ({
  theme,
}: {
  theme: {
    mode: Mode;
  };
}) => {
  // System mode inherits the root ModeProvider, including system changes.
  const resolvedMode = theme.mode === 'system' ? undefined : theme.mode;
  return (
    <div className={cn('flex flex-col gap-3', resolvedMode)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">PREVIEW</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-sm bg-primary" />
          Live preview
        </span>
      </div>
      <div
        className="preview-window overflow-hidden rounded-lg border border-border bg-background"
        aria-label="Live workspace preview"
      >
        <div className="flex h-9 items-center justify-between border-b border-border bg-muted/40 px-3">
          <div className="flex gap-1.5">
            <span className="size-1.5 rounded-sm bg-muted-foreground/40" />
            <span className="size-1.5 rounded-sm bg-muted-foreground/40" />
            <span className="size-1.5 rounded-sm bg-muted-foreground/40" />
          </div>
          <span className="text-xs text-muted-foreground">Your workspace</span>
          <PanelLeft className="size-3 text-muted-foreground" />
        </div>
        <div className="flex min-h-64">
          <div className="hidden w-36 shrink-0 flex-col gap-5 border-r border-border bg-muted/30 p-4 sm:flex">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="flex size-5 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                S
              </div>
              Personal
            </div>
            <div className="flex flex-col gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 text-foreground">
                <FileText className="size-3" />
                All notes
              </span>
              <span className="flex items-center gap-2">
                <Plus className="size-3" />
                New collection
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-16 rounded-sm bg-muted" />
              <div className="h-1.5 w-20 rounded-sm bg-muted" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-5 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Personal / Notes
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium tracking-tight">
                A little room to think.
              </h3>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Collect your ideas. Connect the dots. Make something that
                matters to you.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-4/5 rounded-sm bg-muted" />
              <div className="h-1.5 w-3/5 rounded-sm bg-muted" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex size-4 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
              Make space for the next idea
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
