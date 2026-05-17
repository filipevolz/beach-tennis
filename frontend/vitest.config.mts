import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'lib/**/*.ts',
        'features/**/*.ts',
        'features/**/*.tsx',
        'components/**/*.tsx',
      ],
      exclude: [
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/api.ts',
        'components/app-shell.tsx',
        'features/venues/court-list.tsx',
        'lib/auth-types.ts',
        'lib/auth-cookies.ts',
        'lib/api-types.ts',
        'lib/use-api.ts',
        'app/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
