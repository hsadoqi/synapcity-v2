'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from './use-settings';
import { transferSchema, type TransferFeedback } from '../types/import-export';
import { settingsDefaults } from '../types/settings';
import { download } from '../utils/download';
import { importFile } from '../utils/import';

export function useImportExportSettings() {
  const { settings, updateSettings, isReady } = useSettings();
  const [feedback, setFeedback] = useState<TransferFeedback | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importing = useRef(false);

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const importSettings = useCallback(
    async (file: File) => {
      if (!isReady || importing.current) return;
      // Guard immediately as well as disabling controls on the next render.
      importing.current = true;
      setIsImporting(true);
      setFeedback(null);
      try {
        const result = await importFile(file);
        if (result.type === 'success') updateSettings(result.patch);
        setFeedback({ type: result.type, message: result.message });
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to apply imported preferences.',
        });
      } finally {
        importing.current = false;
        setIsImporting(false);
      }
    },
    [isReady, updateSettings],
  );

  const exportSettings = useCallback(() => {
    if (!isReady || importing.current) return;
    setFeedback(download(settings));
  }, [isReady, settings]);

  const resetSettings = useCallback(() => {
    if (!isReady || importing.current) return;
    try {
      updateSettings(transferSchema.parse(settingsDefaults));
      setFeedback({
        type: 'success',
        message: 'Your preferences are back to their defaults.',
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to reset your preferences. Please try again.',
      });
    }
  }, [isReady, updateSettings]);

  return {
    importExport: { importSettings, exportSettings, resetSettings },
    feedback,
    clearFeedback,
    isImporting,
    isReady,
  };
}
