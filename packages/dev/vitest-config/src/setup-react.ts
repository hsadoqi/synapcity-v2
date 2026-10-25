import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

import './jsdom-polyfills.ts';

// `waitFor` and `findBy*` give up after 1 s by default. Under a full parallel
// coverage run an async state update can take longer than that while the test
// is still correct. Stay well under `testTimeout`, so a real failure still
// reports the missing element instead of a bare test timeout.
configure({ asyncUtilTimeout: 5_000 });

// Testing Library only unmounts automatically when test globals exist.
afterEach(() => {
  cleanup();
});
