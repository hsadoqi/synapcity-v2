'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import {
  SettingsAccordion,
  SettingsAccordionItem,
} from '../../shared/settings-accordion';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell';
import { useImportExportSettings } from '../../hooks';
import {
  ExportRow,
  ImportRow,
  ResetRow,
  ResetSharedLookRow,
} from './import-export-rows';
import { ImportExportFeedbackAlert } from './import-export-feedback-dialog';

export function ImportExportSettings() {
  const { importExport, feedback, clearFeedback, isImporting, isReady } =
    useImportExportSettings();
  const disabled = !isReady || isImporting;

  return (
    <SettingsTabShell
      title="Import / Export"
      description="Take your preferences with you, or start fresh."
    >
      <SettingsAccordion>
        <SettingsAccordionItem value="transfer" title="Transfer">
          <FieldGroup>
            <ExportRow
              onExport={importExport.exportSettings}
              disabled={disabled}
            />
            <ImportRow
              onImport={importExport.importSettings}
              disabled={disabled}
              isImporting={isImporting}
            />
          </FieldGroup>
        </SettingsAccordionItem>
        <SettingsAccordionItem value="reset" title="Reset">
          <FieldGroup>
            <ResetSharedLookRow
              onReset={importExport.resetSharedLook}
              disabled={disabled}
            />
            <ResetRow
              onReset={importExport.resetSettings}
              disabled={disabled}
            />
          </FieldGroup>
        </SettingsAccordionItem>
      </SettingsAccordion>
      {feedback && (
        <ImportExportFeedbackAlert
          feedback={feedback}
          onClose={clearFeedback}
        />
      )}
    </SettingsTabShell>
  );
}
