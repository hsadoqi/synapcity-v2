import { baseConfig } from '@synapcity/dev-vitest-config/base';

// Node environment while the package holds no components. Task 2 of the
// frontend-shells plan switches this to the react (jsdom) preset when the
// first component and its DOM tests move in.
export default baseConfig;
