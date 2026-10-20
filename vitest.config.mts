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
    // The interface tests drive the browser-backed store, which is the
    // one the deployed demonstration uses. Pointing them at the server
    // actions instead would test Next's plumbing, not this app.
    env: { NEXT_PUBLIC_DATA_MODE: 'demo' },
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
