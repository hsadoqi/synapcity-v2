'use client';

import type { DialogContainerTarget } from '@synapcity/frontend-ui/components/dialog-portal-container';
import { AgendaActionsMenu } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-actions-menu';
import { AgendaDate } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-date';
import { AgendaDateNav } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-date-nav';
import { AgendaSettingsView } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-settings-view';
import type { AgendaMenuItem } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-dropdown-menu';
import {
  AgendaTimeSlot,
  TimeSlot,
} from '@synapcity/frontend-ui/blocks/day-agenda/agenda-time-slot';
import { ScrollArea } from '@synapcity/frontend-ui/core/scroll-area';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import type { DayAgendaDialogContainer } from './day-agenda.types';
import { surfaceClasses } from '@synapcity/frontend-ui/blocks/countdown-card';
export type DayAgendaData = {
  /** Shown in place of the list when there are no slots. */
  empty?: ReactNode;
  date: string;
  slots: TimeSlot[];
};

type Surface = 'card' | 'glass';

/**
 * How the date is written. Separate from the style props so a settings form
 * can own them later.
 */
export type DayAgendaDateDisplay = {
  /** @default 'en-US' */
  locale?: Intl.LocalesArgument;
  /** @default short weekday, short month, numeric day */
  dateFormat?: Intl.DateTimeFormatOptions;
};

export type DayAgendaStyleProps = {
  /**
   * Draw the agenda's own card (surface, border, padding, shadow). Turn it off
   * inside a host that draws its own frame, such as a dashboard widget or the
   * global panel, so there is no card inside a card.
   * @default true
   */
  frame?: boolean;
  /**
   * Show the agenda's own toolbar. Turn it off when the host shows the
   * agenda's actions in its own toolbar.
   * @default true
   */
  toolbar?: boolean;
  surface?: Surface;
  bordered?: boolean;
  inverted?: boolean;
  className?: string;
};

export type DayAgendaProps = DayAgendaData &
  DayAgendaStyleProps &
  DayAgendaDateDisplay & {
    /**
     * Shows previous and next day buttons, and makes the date open a calendar.
     * Called with the new `yyyy-MM-dd` date; set `date` and load its slots.
     * Without it the date is plain text.
     */
    onDateChange?: (date: string) => void;
  };

/** What the settings dialog shows. Every field is optional. */
export type DayAgendaSettings = {
  /** @default 'Settings' */
  title?: string;
  /** @default 'Manage your agenda preferences' */
  description?: string;
  /** Opens the dialog. @default a ghost cog icon button */
  trigger?: ReactElement;
  /** Dialog body. @default placeholder rows */
  content?: ReactNode;
};

export type DayAgendaWithDialog = DayAgendaProps & {
  /** @default true */
  modal?: boolean;
  /**
   * Where the dialog renders.
   * - `'card'` (default): sized and centred inside the agenda card.
   * - `'window'`: centred on the window, still inside this block's theme.
   * - `'body'`, `'inline'`, an element or a ref: passed to `DialogPortalContainer`.
   */
  dialogContainer?: DayAgendaDialogContainer;
  settings?: DayAgendaSettings;
  /** Toolbar and "More actions" items; give one an `icon` to make it a toolbar button. @default Theme, Settings and Help */
  /**
   * How settings opens.
   * - `'auto'` (default): in place of the agenda while the card is narrower
   *   than 24rem, where a dialog inside it would be cramped; a dialog from there up.
   * - `'dialog'`: always the dialog, placed by `dialogContainer`.
   * - `'view'`: always in place.
   */
  settingsPresentation?: 'auto' | 'dialog' | 'view';
  menuItems?: readonly AgendaMenuItem[];
};

/* A dialog is `position: fixed`, so it is sized and placed against its
   containing block: the viewport, unless an ancestor has a `transform`,
   `filter`, `backdrop-filter` or `contain: layout` (MDN, "Layout and the
   containing block").
   - `'card'` renders into the card and gives it `contain-layout`, so the dialog
     is placed against the card on every surface, not only on glass, whose
     blur would otherwise decide it by accident.
   - `'window'` renders into the outer wrapper: still inside the inverted theme
     scope, but outside the card's blur, so it is placed against the viewport. */

export function DayAgenda({
  date,
  slots = [],
  empty,
  surface = 'card',
  frame = true,
  toolbar = true,
  bordered = false,
  inverted = false,
  className,
  modal = true,
  dialogContainer = 'card',
  settings,
  menuItems,
  settingsPresentation = 'auto',
  onDateChange,
  locale,
  dateFormat,
}: DayAgendaWithDialog) {
  const [showingSettings, setShowingSettings] = useState(false);
  const scope = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const container: DialogContainerTarget =
    dialogContainer === 'card'
      ? card
      : dialogContainer === 'window'
        ? scope
        : dialogContainer;
  return (
    <div
      ref={scope}
      className={cn(
        // No vertical centring: the card fills the height it is given, so the
        // slot list can scroll inside it.
        'flex size-full justify-center',
        frame && 'p-4',
        inverted && surfaceClasses[surface][inverted ? 'inverted' : 'plain'],
        className,
      )}
    >
      <div
        ref={card}
        className={cn(
          'relative flex w-full flex-1 flex-col gap-2',
          frame && 'rounded-xl p-3 shadow-sm',
          dialogContainer === 'card' && 'contain-layout',
          frame && surfaceClasses[surface],
          frame && bordered && 'border border-border/15',
        )}
      >
        <div className="flex min-h-6 items-center justify-between gap-2">
          {onDateChange ? (
            <AgendaDateNav
              date={date}
              onDateChange={onDateChange}
              locale={locale}
              format={dateFormat}
            />
          ) : (
            date && (
              <AgendaDate date={date} locale={locale} format={dateFormat} />
            )
          )}
          {toolbar && (
            <AgendaActionsMenu
              title={settings?.title ?? 'Settings'}
              description={
                settings?.description ?? 'Manage your agenda preferences'
              }
              trigger={settings?.trigger}
              menuItems={menuItems}
              settingsPresentation={settingsPresentation}
              onOpenSettingsView={() => setShowingSettings(true)}
              modal={modal}
              container={container}
            >
              {settings?.content}
            </AgendaActionsMenu>
          )}
        </div>
        {showingSettings ? (
          <AgendaSettingsView
            title={settings?.title ?? 'Settings'}
            description={
              settings?.description ?? 'Manage your agenda preferences'
            }
            onDone={() => setShowingSettings(false)}
          >
            {settings?.content}
          </AgendaSettingsView>
        ) : (
          <>
            {/* Scrolls once the card has a height to fill: a ScrollArea needs a
                parent of known height, as in a dashboard cell. */}
            <ScrollArea className="min-h-0 flex-1">
              {slots.length === 0 && empty ? (
                empty
              ) : (
                <ul className="flex flex-col gap-1.5 pr-3">
                  {slots.map((slot, index) => (
                    <AgendaTimeSlot
                      key={slot.id ?? `${slot.start}-${slot.label}-${index}`}
                      {...slot}
                    />
                  ))}
                </ul>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
