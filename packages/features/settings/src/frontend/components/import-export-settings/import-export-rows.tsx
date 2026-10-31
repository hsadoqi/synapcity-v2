'use client';

import { Upload, Download, RotateCcw } from 'lucide-react';
import { SettingRow } from '../shared/setting-row';
import { useRef, useState } from 'react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@synapcity/frontend-ui/core/alert-dialog';
export const ExportRow = ({
  onExport,
  disabled,
}: {
  onExport: () => void;
  disabled: boolean;
}) => {
  return (
    <SettingRow
      id="export"
      label="Export preferences"
      description="Download your current settings as a small JSON file."
    >
      <Button
        id="export"
        variant="outline"
        onClick={onExport}
        disabled={disabled}
        aria-describedby="export-description"
      >
        <Download data-icon="inline-start" />
        Export JSON
      </Button>
    </SettingRow>
  );
};

export const ImportRow = ({
  onImport,
  disabled,
  isImporting,
}: {
  onImport: (file: File) => Promise<void>;
  disabled: boolean;
  isImporting: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport(file: File) {
    try {
      await onImport(file);
    } finally {
      // Reset even after a failed import so the same file can be selected again.
      if (inputRef.current) inputRef.current.value = '';
    }
  }
  return (
    <SettingRow
      id="import"
      label="Import preferences"
      description="Bring in a settings file. Only valid preferences will be updated."
    >
      <Button
        id="import"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-busy={isImporting}
        aria-describedby="import-description"
      >
        <Upload data-icon="inline-start" />
        {isImporting ? 'Importing…' : 'Import JSON'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        aria-label="Import preferences file"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
        }}
      />
    </SettingRow>
  );
};

export const ResetRow = ({
  onReset,
  disabled,
}: {
  onReset: () => void;
  disabled: boolean;
}) => {
  return (
    <ResetConfirmationRow
      id="reset"
      label="Reset to defaults"
      description="Restore the original settings. Your notes won’t be affected."
      trigger="Reset to defaults"
      title="Start with a clean slate?"
      dialogDescription="This resets your theme, display, regional and notification preferences, and turns off any data you agreed to share. Your notes stay right where they are."
      cancel="Keep my settings"
      action="Reset preferences"
      onReset={onReset}
      disabled={disabled}
    />
  );
};

export const ResetSharedLookRow = ({
  onReset,
  disabled,
}: {
  onReset: () => void;
  disabled: boolean;
}) => {
  return (
    <ResetConfirmationRow
      id="reset-shared-look"
      label="Reset shared look"
      description="Restore the default mode, fonts and display choices on web and docs."
      trigger="Reset shared look"
      title="Reset the shared look?"
      dialogDescription="This restores the default mode, fonts, text size, spacing, corners, contrast, motion and borders everywhere the look is shared. Regional, notification and privacy preferences won’t change."
      cancel="Keep my look"
      action="Reset shared look everywhere"
      onReset={onReset}
      disabled={disabled}
    />
  );
};

function ResetConfirmationRow({
  id,
  label,
  description,
  trigger,
  title,
  dialogDescription,
  cancel,
  action,
  onReset,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  trigger: string;
  title: string;
  dialogDescription: string;
  cancel: string;
  action: string;
  onReset: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <SettingRow id={id} label={label} description={description}>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          id={id}
          disabled={disabled}
          aria-describedby={`${id}-description`}
          render={<Button variant="outline" />}
        >
          <RotateCcw data-icon="inline-start" />
          {trigger}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={disabled}
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              {action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingRow>
  );
}
