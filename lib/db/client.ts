'use client';

import { DATA_MODE } from '@/lib/config';
import { createBrowserRepository } from './providers/browser';
import { MemoryLeadRepository } from './providers/memory';
import { serverActionRepository } from './providers/serverAction';
import type { LeadRepository } from './repository';

/**
 * The repository the interface talks to, chosen once per page load.
 *
 * Both branches satisfy the same contract and the same tests, so the
 * components above this line do not know, and must not care, which
 * store they are writing to.
 */

let cached: LeadRepository | null = null;

export function getClientRepository(): LeadRepository {
  if (cached) return cached;

  if (DATA_MODE === 'database') {
    cached = serverActionRepository;
  } else if (typeof window === 'undefined') {
    // Rendered on the server in demo mode: there is no localStorage to
    // read, so the first paint has an empty store and the browser one
    // takes over on hydration.
    cached = new MemoryLeadRepository();
  } else {
    cached = createBrowserRepository(window.localStorage);
  }
  return cached;
}

/** Tests and the demo reset need to start again from storage. */
export function resetClientRepository(): void {
  cached = null;
}
