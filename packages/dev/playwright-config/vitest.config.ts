import { baseConfig } from '@synapcity/dev-vitest-config/base';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(baseConfig, defineConfig({}));
