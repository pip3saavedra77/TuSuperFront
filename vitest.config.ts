import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/app/core/guards/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/app/core/**/*.ts'],
      exclude: ['src/app/core/**/*.spec.ts', 'src/app/core/**/*.mock.ts'],
      thresholds: {
        'src/app/core/guards/**/*.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        }
      },
    },
  },
});
