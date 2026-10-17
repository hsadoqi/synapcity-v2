'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { SettingsSection, SettingsTabShell } from '../../shared';
import { useImportExportSettings } from '../../hooks/use-import-export-settings';
import { ExportRow, ImportRow, ResetRow } from './import-export-rows';
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
      <SettingsSection title="Transfer">
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
      </SettingsSection>
      <Separator />
      <SettingsSection title="Reset">
        <FieldGroup>
          <ResetRow onReset={importExport.resetSettings} disabled={disabled} />
        </FieldGroup>
      </SettingsSection>
      {feedback && (
        <ImportExportFeedbackAlert
          feedback={feedback}
          onClose={clearFeedback}
        />
      )}
    </SettingsTabShell>
  );
}
