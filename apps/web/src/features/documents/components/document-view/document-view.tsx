'use client';

import type { BaseRecord } from '@synapcity/domain-records';
import { EntityIcon } from '@synapcity/frontend-collection';
import { ResourceFrame, ResourceHeader } from '@synapcity/frontend-shells';

import { RESOURCE_PANEL } from '@/components/resource-panel';

import { DocumentDetails } from './document-details';

/**
 * One document, read-only: its name, icon, description, dates and tags.
 * Document content is not stored yet, so the body says so plainly in a note
 * rather than showing an editor that would lose what is typed. That note is
 * the one region a later content integration replaces.
 */
export function DocumentView({ document }: { document: BaseRecord }) {
  return (
    <ResourceFrame
      label={document.name}
      header={
        <ResourceHeader
          title={document.name}
          icon={<EntityIcon name={document.icon} className="size-4" />}
        />
      }
      destinations={RESOURCE_PANEL}
    >
      <div className="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-6 @3xl/main:px-8 @3xl/main:py-10">
        {document.description && (
          <p className="text-pretty wrap-break-word text-muted-foreground">
            {document.description}
          </p>
        )}
        <DocumentDetails
          createdAt={document.createdAt}
          updatedAt={document.updatedAt}
          tags={document.tags}
        />
        <p
          role="note"
          aria-label="Document content"
          className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground"
        >
          This document’s content can’t be shown yet. Writing and saving
          document content isn’t available yet.
        </p>
      </div>
    </ResourceFrame>
  );
}
