'use client';

import {
  Card,
  CardHeader,
  CardAction,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@synapcity/frontend-ui/core/card';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { useSettingsDraft } from '../../../hooks/use-settings-draft';
import { SettingsDraftFields } from '../../settings-drafts/settings-draft-fields';
import { SettingsTabFooter } from '../settings-tab-footer';
import { useWideLayout } from '../../../hooks/use-settings-layout';
import {
  SettingsAccordion,
  SettingsAccordionItem,
} from '../../settings-accordion';

type TabDraft = Pick<
  ReturnType<typeof useSettingsDraft>,
  | 'hasChanges'
  | 'atDefaults'
  | 'save'
  | 'discard'
  | 'resetAll'
  | 'isUnsaved'
  | 'isDefault'
  | 'resetField'
>;

export const SettingsTabShell = ({
  title,
  description,
  action,
  draft,
  preview,
  children,
}: {
  title: string;
  description: string;
  /** A control for the whole tab, set at the header's end where it stays in view. */
  action?: ReactNode;
  /**
   * The tab's draft (`useSettingsDraft`). Its rows then mark what is unsaved
   * and offer their own reset, and the footer saves, discards or resets it.
   */
  draft?: TabDraft;
  /**
   * What the tab's choices look like. A rail beside the settings where the
   * screen is wide; otherwise the first section of the tab, "How it looks",
   * unless `inline` is false (a tab that already offers its preview another way).
   */
  preview?: {
    content: ReactNode;
    inline?: boolean;
    /** A wider rail, for a preview that is itself a small workspace (Theme). */
    wide?: boolean;
  };
  children: ReactNode;
}) => {
  const wide = useWideLayout();
  const rail = preview && wide;
  const inlinePreview = preview && !wide && preview.inline !== false;
  const settings = (
    <CardContent className="min-w-0 flex-1 roomy:overflow-auto">
      <div className="flex flex-col gap-8">
        {inlinePreview && (
          <SettingsAccordion>
            <SettingsAccordionItem value="preview" title="How it looks">
              {preview.content}
            </SettingsAccordionItem>
          </SettingsAccordion>
        )}
        {children}
      </div>
    </CardContent>
  );
  // The rail keeps its place while the settings beside it scroll.
  const content = rail ? (
    <div className="flex min-h-0 flex-1">
      {settings}
      <aside
        aria-label="Preview"
        className={cn(
          'flex shrink-0 flex-col gap-4 overflow-auto border-s border-border px-6',
          preview.wide ? 'w-md' : 'w-80',
        )}
      >
        <h3 className="font-heading text-base font-semibold">How it looks</h3>
        {preview.content}
      </aside>
    </div>
  ) : (
    settings
  );
  return (
    // Not clipped on a small screen: there the page shell scrolls, and a
    // clipping card would hold the sticky footer inside itself instead.
    <Card className="flex-1 overflow-visible roomy:overflow-hidden">
      {/* The rule splits the tab's identity from its settings. */}
      <CardHeader className="border-b">
        <CardTitle as="h2">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {draft ? (
        <SettingsDraftFields
          value={{
            isUnsaved: draft.isUnsaved as (field: string) => boolean,
            isDefault: draft.isDefault as (field: string) => boolean,
            resetField: draft.resetField as (field: string) => void,
          }}
        >
          {content}
        </SettingsDraftFields>
      ) : (
        content
      )}
      {/* Below the scroll area on a roomy screen; stuck to the bottom of the
          screen on a small one, where the whole page scrolls. */}
      {draft && (
        <CardFooter className="sticky bottom-0 border-t bg-card">
          <SettingsTabFooter
            tab={title}
            hasChanges={draft.hasChanges}
            atDefaults={draft.atDefaults}
            onSave={draft.save}
            onDiscard={draft.discard}
            onReset={draft.resetAll}
          />
        </CardFooter>
      )}
    </Card>
  );
};
