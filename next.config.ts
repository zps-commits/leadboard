import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // cacheComponents is off: every page here reads the lead store on each
  // request, and the flag forbids the dynamic rendering that requires.
  cacheComponents: false,
  // The repository sits below a lockfile in the home directory; without
  // this Next picks that one as the workspace root.
  outputFileTracingRoot: path.join(import.meta.dirname),
  // better-sqlite3 is a native module and must not be bundled.
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
};

export default nextConfig;
