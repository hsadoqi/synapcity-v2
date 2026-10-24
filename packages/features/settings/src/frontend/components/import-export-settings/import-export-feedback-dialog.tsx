'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@synapcity/frontend-ui/core/alert';
import { CircleAlert, CheckCircle2 } from 'lucide-react';
import type { TransferFeedback } from '../../types';

export const ImportExportFeedbackAlert = ({
  feedback,
  onClose,
}: {
  feedback: TransferFeedback | null;
  onClose: () => void;
}) => {
  if (!feedback) return null;

  return (
    <Alert
      variant={feedback.type === 'error' ? 'destructive' : 'default'}
      role={feedback.type === 'error' ? 'alert' : 'status'}
    >
      {feedback.type === 'error' ? <CircleAlert /> : <CheckCircle2 />}
      <AlertTitle>
        {feedback.type === 'error' ? 'Couldn’t complete the action' : 'All set'}
      </AlertTitle>
      <AlertDescription>
        {feedback.message}
        <Button size="sm" variant="ghost" onClick={onClose}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
};
