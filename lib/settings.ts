'use client';

import type { CurrencyCode } from './format';

/**
 * The display currency, kept outside React.
 *
 * Reading localStorage during render would disagree with what the
 * server rendered, and writing it from an effect is what React 19's
 * lint rightly refuses. An external store read through
 * useSyncExternalStore has a server snapshot of its own, so the first
 * paint is defined and the stored choice arrives on hydration.
 */

const KEY = 'leadboard.settings.v1';
const SERVER_DEFAULT: CurrencyCode = 'BRL';

let current: CurrencyCode | null = null;
const listeners = new Set<() => void>();

function read(): CurrencyCode {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed === 'object' && parsed !== null) {
      const currency = (parsed as { currency?: unknown }).currency;
      if (currency === 'BRL' || currency === 'USD') return currency;
    }
  } catch {
    // Private browsing, or a value written by an older version.
  }
  return SERVER_DEFAULT;
}

export const currencyStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): CurrencyCode {
    current ??= read();
    return current;
  },

  getServerSnapshot(): CurrencyCode {
    return SERVER_DEFAULT;
  },

  set(currency: CurrencyCode): void {
    current = currency;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ currency }));
    } catch {
      // The choice still holds for this session.
    }
    for (const listener of listeners) listener();
  },
};
