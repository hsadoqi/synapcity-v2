'use client';

import { useEffect } from 'react';

import { useCanCollect } from '@synapcity/frontend-preferences';
import { startErrorReports, stopErrorReports } from './sentry-client';

/**
 * Sends browser errors to Sentry while the person allows error reports, and
 * stops as soon as they turn it off. Renders nothing.
 *
 * It does not stop on unmount: `global-error` replaces the whole tree, this
 * included, and must still be able to report the error that caused it.
 */
export function ErrorReports() {
  const allowed = useCanCollect('errorReports');
  useEffect(() => {
    if (allowed) startErrorReports();
    else stopErrorReports();
  }, [allowed]);
  return null;
}
