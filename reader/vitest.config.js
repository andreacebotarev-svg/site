/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    testMatch: [
      '**/__tests__/**/*.test.js',
      '**/?(*.)+(spec|test).js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/setup.js',
        '**/*.config.js',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 90,
          lines: 80
        }
      }
    },
    watch: {
      include: ['assets/js/**/*', 'tests/**/*']
    }
  },
  // Path aliases for easier imports in tests
  resolve: {
    alias: {
      '@': './assets/js',
      '@components': './assets/js/ui/components',
      '@managers': './assets/js/ui/managers',
      '@services': './assets/js/services',
      '@utils': './assets/js/utils'
    }
  }
});
