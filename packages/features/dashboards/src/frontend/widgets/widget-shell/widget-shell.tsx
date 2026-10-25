'use client';

import type {
  DashboardSettings,
  Widget,
  WidgetHighlight,
  WidgetPatch,
} from '@synapcity/domain-dashboards';
import {
  ActionsToolbar,
  type ToolbarAction,
  type ToolbarSettings,
} from '@synapcity/frontend-ui/blocks/actions-toolbar';
import { SettingsView } from '@synapcity/frontend-ui/blocks/settings-view';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  LockIcon,
  LockOpenIcon,
  PinIcon,
  PinOffIcon,
  Settings2Icon,
} from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

/**
 * What the widget's content offers the shell's toolbar: its own actions and
 * settings. The content stays host-agnostic; the shell decides where they go.
 * The shell supplies `onOpenView` and shows settings in place itself.
 */
export type WidgetShellToolbar = {
  actions?: readonly ToolbarAction[];
  settings?: Omit<ToolbarSettings, 'onOpenView'>;
};

export type WidgetShellActions = {
  update(patch: WidgetPatch): void;
  duplicate(): void;
  hide(): void;
  archive(): void;
  remove(): void;
};

const HIGHLIGHT_BAR: Record<WidgetHighlight, string> = {
  accent: 'bg-primary',
  neutral: 'bg-muted-foreground',
  none: 'bg-transparent',
};

const HIGHLIGHT_OPTIONS: {
  value: WidgetHighlight;
  label: string;
  swatch: string;
}[] = [
  { value: 'accent', label: 'Accent highlight', swatch: 'bg-primary' },
  {
    value: 'neutral',
    label: 'Neutral highlight',
    swatch: 'bg-muted-foreground',
  },
  { value: 'none', label: 'No highlight', swatch: 'bg-muted' },
];

const CARD_RADIUS: Record<DashboardSettings['cardRadius'], string> = {
  4: 'rounded-sm',
  8: 'rounded-md',
  12: 'rounded-lg',
  16: 'rounded-xl',
};

function WidgetTitle({
  title,
  id,
  editMode,
  visible,
  onRename,
}: {
  title: string;
  id: string;
  editMode: boolean;
  visible: boolean;
  onRename: (title: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // In edit mode the title always shows, so its rename button is never focusable but invisible.
  const heading = cn(
    'm-0 truncate text-base font-semibold text-foreground',
    !visible && !editMode && 'sr-only',
  );

  if (draft !== null) {
    const commit = () => {
      const next = draft.trim();
      if (next && next !== title) onRename(next);
      setDraft(null);
    };
    // Inside the heading, so the widget stays named by its title while it is edited.
    return (
      <h2 id={id} className={heading}>
        <input
          aria-label="Widget title"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') setDraft(null);
          }}
          className="w-full border-0 bg-transparent p-0 text-base font-semibold text-foreground outline-none"
        />
      </h2>
    );
  }

  return (
    <h2 id={id} className={heading}>
      {editMode ? (
        <button
          type="button"
          aria-label={`Rename ${title}`}
          onClick={() => setDraft(title)}
          className="w-full cursor-text truncate border-0 bg-transparent p-0 text-left"
        >
          {title}
        </button>
      ) : (
        title
      )}
    </h2>
  );
}

function WidgetSettings({
  widget,
  actions,
}: {
  widget: Widget;
  actions: WidgetShellActions;
}) {
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Settings for ${widget.title}`}
          />
        }
      >
        <Settings2Icon />
      </PopoverTrigger>
      <PopoverContent className="flex w-52 flex-col gap-2.5">
        <PopoverTitle>Widget settings</PopoverTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Highlight</span>
          <div role="group" aria-label="Highlight" className="flex gap-1.5">
            {HIGHLIGHT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={widget.highlight === option.value}
                onClick={run(() => actions.update({ highlight: option.value }))}
                className={cn(
                  'size-5 cursor-pointer rounded-full border border-border p-0',
                  option.swatch,
                  widget.highlight === option.value &&
                    'ring-2 ring-ring ring-offset-1',
                )}
              />
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={run(actions.duplicate)}
        >
          Duplicate widget
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={run(actions.hide)}
        >
          Hide widget
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={run(actions.archive)}
        >
          Archive widget
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={run(actions.remove)}
        >
          Remove widget
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A widget's frame: its title (renamed in place in edit mode), highlight,
 * collapse and settings. The body comes in as children. Props only, so it
 * can move to its own package with the other widgets.
 */
export function WidgetShell({
  widget,
  settings,
  editMode,
  actions,
  toolbar,
  children,
}: {
  widget: Widget;
  settings: DashboardSettings;
  editMode: boolean;
  actions: WidgetShellActions;
  /** The content's actions and settings, shown in the header. Optional. */
  toolbar?: WidgetShellToolbar;
  children: ReactNode;
}) {
  const titleId = useId();
  const [showingSettings, setShowingSettings] = useState(false);
  /*
   * The shell's own actions, after the content's. Pin surfaces the widget
   * elsewhere and is always offered; lock and size are layout, so edit mode
   * only. Show is not here: a hidden widget is not on the dashboard, so it is
   * shown again from the widgets panel.
   */
  const shellActions: ToolbarAction[] = [
    {
      label: widget.pinned ? 'Unpin' : 'Pin',
      icon: widget.pinned ? <PinOffIcon /> : <PinIcon />,
      onSelect: () => actions.update({ pinned: !widget.pinned }),
    },
    ...(editMode
      ? [
          {
            label: widget.locked ? 'Unlock position' : 'Lock position',
            icon: widget.locked ? <LockOpenIcon /> : <LockIcon />,
            onSelect: () => actions.update({ locked: !widget.locked }),
          },
          {
            label: widget.resizable === false ? 'Allow resizing' : 'Keep size',
            onSelect: () =>
              actions.update({ resizable: widget.resizable === false }),
          },
        ]
      : []),
    { label: 'Hide', onSelect: actions.hide },
    { label: 'Archive', onSelect: actions.archive },
  ];
  const toolbarActions = [...(toolbar?.actions ?? []), ...shellActions];
  const movable = editMode && !widget.locked;
  const toolbarSettings = toolbar?.settings && {
    ...toolbar.settings,
    onOpenView: () => setShowingSettings(true),
  };
  const CollapseIcon = widget.collapsed ? ChevronDownIcon : ChevronUpIcon;

  return (
    <section
      data-slot="widget"
      aria-labelledby={titleId}
      className={cn(
        'group/widget relative flex w-full min-w-0 flex-col overflow-hidden border border-border bg-card text-card-foreground',
        CARD_RADIUS[settings.cardRadius],
        widget.collapsed ? 'h-auto self-start' : 'h-full',
        editMode && 'outline outline-ring',
        movable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <header className="relative flex h-12 w-full shrink-0 items-center gap-2 px-3.5">
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 w-1',
            HIGHLIGHT_BAR[widget.highlight],
          )}
        />
        {movable && (
          // A cue only: the whole widget drags in edit mode, and the keyboard
          // moves it with the arrow keys. Hidden until hover or focus where
          // the pointer can hover; always shown on touch, which cannot.
          <GripVerticalIcon
            aria-hidden="true"
            data-slot="widget-drag-handle"
            className="size-4 shrink-0 text-muted-foreground transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover/widget:opacity-100 pointer-fine:group-focus-within/widget:opacity-100"
          />
        )}
        <div className="min-w-0 flex-1">
          <WidgetTitle
            title={widget.title}
            id={titleId}
            editMode={editMode}
            visible={settings.showWidgetTitles}
            onRename={(title) => actions.update({ title })}
          />
        </div>
        <ActionsToolbar
          className="flex-1"
          actions={toolbarActions}
          settings={toolbarSettings}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-expanded={!widget.collapsed}
          aria-label={
            widget.collapsed
              ? `Expand ${widget.title}`
              : `Collapse ${widget.title}`
          }
          onClick={() => actions.update({ collapsed: !widget.collapsed })}
        >
          <CollapseIcon />
        </Button>
        {editMode && <WidgetSettings widget={widget} actions={actions} />}
      </header>
      {!widget.collapsed && showingSettings && toolbar?.settings && (
        <div className="flex min-h-0 flex-1 flex-col border-t border-divider px-3.5 py-3">
          <SettingsView
            title={toolbar.settings.title}
            description={toolbar.settings.description}
            onDone={() => setShowingSettings(false)}
          >
            {toolbar.settings.content}
          </SettingsView>
        </div>
      )}
      {!widget.collapsed && !showingSettings && (
        // Focusable and named, so the keyboard can scroll a body that overflows its cell.
        <div
          role="group"
          aria-label={`${widget.title} content`}
          tabIndex={0}
          className="min-h-0 flex-1 overflow-auto border-t border-divider px-3.5 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {children}
        </div>
      )}
    </section>
  );
}
