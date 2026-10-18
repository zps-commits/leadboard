import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // 'server-only' throws by design when it is imported outside a
      // server component. Under Vitest the server modules ARE the unit
      // under test, so the guard is stubbed rather than removed from
      // the source, where it is doing real work.
      'server-only': fileURLToPath(new URL('./tests/serverOnlyStub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
