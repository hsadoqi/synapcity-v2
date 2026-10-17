'use client';

import { useEffect } from 'react';
import { type FontChoice } from '../types/fonts';
import { loadFont } from '../shared/font-preferences';

export function usePreviewFont(choice: FontChoice) {
  useEffect(() => {
    if (choice !== 'default') loadFont(document, choice);
  }, [choice]);
}
