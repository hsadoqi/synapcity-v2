import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only unmounts automatically when test globals exist.
afterEach(() => {
  cleanup();
});
