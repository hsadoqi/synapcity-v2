'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export type Confirm = 'leave' | 'restart' | null;

type Props = {
  open: Confirm;
  onClose: () => void;
  onLeaveKeep: () => void;
  onDiscard: () => void;
  onRestart: () => void;
};

/** Leaving a half-finished run, or restarting it, always asks first. Answers are never lost silently. */
export function ConfirmDialogs({
  open,
  onClose,
  onLeaveKeep,
  onDiscard,
  onRestart,
}: Props) {
  return (
    <AlertDialog
      open={open !== null}
      onOpenChange={(next) => !next && onClose()}
    >
      <AlertDialogContent size="default">
        {open === 'restart' ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Restart this run?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears your answers and notes so far and starts from step
                one.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="touch">Keep going</AlertDialogCancel>
              <Button variant="destructive" size="touch" onClick={onRestart}>
                Restart run
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave this run?</AlertDialogTitle>
              <AlertDialogDescription>
                Your answers are saved on this device. You can pick up where you
                left off from the home screen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:flex-wrap">
              <AlertDialogCancel size="touch">Keep going</AlertDialogCancel>
              <Button variant="secondary" size="touch" onClick={onLeaveKeep}>
                Leave, keep progress
              </Button>
              <Button variant="destructive" size="touch" onClick={onDiscard}>
                Discard run
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
