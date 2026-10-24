'use client';

import { useEffect } from 'react';

import { useCanCollect } from '@synapcity/frontend-preferences';
import {
  startErrorReports,
  stopErrorReports,
  type ErrorReportsConfig,
} from './sentry-client';

/**
 * Sends browser errors to Sentry while the person allows error reports, and
 * stops as soon as they turn it off. Renders nothing.
 *
 * It does not stop on unmount: `global-error` replaces the whole tree, this
 * included, and must still be able to report the error that caused it.
 */
export function ErrorReports(config: ErrorReportsConfig) {
  const allowed = useCanCollect('errorReports');
  const { dsn, environment, release } = config;
  useEffect(() => {
    if (allowed) startErrorReports({ dsn, environment, release });
    else stopErrorReports();
  }, [allowed, dsn, environment, release]);
  return null;
}
