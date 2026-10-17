'use client';

import { Upload, Download, RotateCcw } from 'lucide-react';
import { SettingRow } from '../../shared/setting-row/setting-row';
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
  const [open, setOpen] = useState(false);
  return (
    <SettingRow
      id="reset"
      label="Reset to defaults"
      description="Restore the original settings. Your notes won’t be affected."
    >
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          id="reset"
          disabled={disabled}
          aria-describedby="reset-description"
          render={<Button variant="outline" />}
        >
          <RotateCcw data-icon="inline-start" />
          Reset to defaults
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start with a clean slate?</AlertDialogTitle>
            <AlertDialogDescription>
              This resets your theme, display, regional and notification
              preferences, and turns off any data you agreed to share. Your
              notes stay right where they are.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my settings</AlertDialogCancel>
            <AlertDialogAction
              disabled={disabled}
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              Reset preferences
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingRow>
  );
};
