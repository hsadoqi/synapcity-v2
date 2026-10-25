'use client';

import { Check, GripVertical, Timer } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { DestinationIcon } from '@/components/icons';
import { NoteEditor } from '@/components/run/note-editor';
import { ButtonLink } from '@/components/ui/button';
import type { BoardItem } from '@/lib/board/model';
import type { MoveKey } from '@/lib/board/layout';
import type { FocusPlan } from '@/lib/focus';
import { DESTINATION_META, type DestinationId } from '@/lib/runs/destinations';
import { cn } from '@/lib/utils';

const ARROWS: MoveKey[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

type WidgetFrameProps = {
  id: string;
  title: string;
  icon: DestinationId;
  meta?: string;
  onNudge: (key: MoveKey, resize: boolean) => void;
  children: ReactNode;
};

/**
 * Every widget has a header that works as the drag handle. The grip button is the keyboard
 * route to the same thing: arrows move the widget, Shift and arrows resize it.
 */
export function WidgetFrame({
  id,
  title,
  icon,
  meta,
  onNudge,
  children,
}: WidgetFrameProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!ARROWS.includes(event.key as MoveKey)) return;
    event.preventDefault();
    onNudge(event.key as MoveKey, event.shiftKey);
  };
  return (
    <section
      aria-labelledby={`widget-${id}`}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-card"
    >
      <header className="widget-handle flex cursor-grab items-center gap-2 border-b px-3 py-2 active:cursor-grabbing">
        <DestinationIcon dest={icon} className="size-4 text-primary" />
        <h2 id={`widget-${id}`} className="text-sm font-semibold">
          {title}
        </h2>
        {meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
        <button
          type="button"
          onKeyDown={onKeyDown}
          aria-label={`Move ${title}. Arrow keys move it, Shift and arrow keys resize it.`}
          className="ml-auto flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </section>
  );
}

export function ItemsWidget({
  dest,
  items,
  onToggle,
}: {
  dest: DestinationId;
  items: BoardItem[];
  onToggle: (dest: DestinationId, id: string) => void;
}) {
  const checkable = DESTINATION_META[dest].checkable;
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          {checkable ? (
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              onClick={() => onToggle(dest, item.id)}
              className="group flex min-h-9 flex-1 items-start gap-3 py-1.5 text-left"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors',
                  item.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input group-hover:border-primary',
                )}
              >
                {item.done ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : null}
              </span>
              <span
                className={cn(
                  'text-[0.9375rem]',
                  item.done && 'text-muted-foreground line-through',
                )}
              >
                {item.text}
              </span>
            </button>
          ) : (
            <p className="min-h-9 flex-1 py-1.5 text-[0.9375rem]">
              {item.text}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function FocusWidget({ plan }: { plan: FocusPlan | null }) {
  if (!plan) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing chosen yet. A run with a focus step will set this up.
      </p>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between gap-3">
      <div>
        <p className="text-xl leading-tight font-light">{plan.label}</p>
        <p className="text-sm text-muted-foreground">
          {plan.sessions} {plan.sessions === 1 ? 'session' : 'sessions'} of{' '}
          {plan.sessionMin} minutes, {plan.breakMin} minute breaks.
        </p>
      </div>
      <ButtonLink href="/focus" size="touch" className="self-start">
        <Timer data-icon="inline-start" />
        Start focus session
      </ButtonLink>
    </div>
  );
}

export function JournalWidget({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (text: string) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">
        Private. Runs add to this; you can write anywhere in it.
      </p>
      <NoteEditor
        initialValue={initial}
        onChange={(text) => {
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => latest.current(text), 350);
        }}
        ariaLabel="Journal for today"
        placeholder="Write about your day..."
        minHeight="min-h-40"
        className="[&_[contenteditable]]:border-0"
      />
    </div>
  );
}
