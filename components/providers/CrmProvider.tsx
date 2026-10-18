'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { crmStore, type CrmState } from '@/lib/store/crmStore';
import type { CurrencyCode } from '@/lib/format';
import { currencyStore } from '@/lib/settings';

/**
 * A thin reader over the two stores.
 *
 * There is no provider state and no effect: components subscribe to the
 * stores directly, so a write and a read cannot get out of order.
 */

export function CrmProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useCrmState(): CrmState {
  return useSyncExternalStore(
    crmStore.subscribe,
    crmStore.getSnapshot,
    crmStore.getServerSnapshot,
  );
}

export function useCurrency(): [CurrencyCode, (next: CurrencyCode) => void] {
  const currency = useSyncExternalStore(
    currencyStore.subscribe,
    currencyStore.getSnapshot,
    currencyStore.getServerSnapshot,
  );
  return [currency, currencyStore.set];
}

export function useCrm() {
  const state = useCrmState();
  const [currency, setCurrency] = useCurrency();
  return { ...state, currency, setCurrency, ...actions };
}

const actions = {
  createLead: crmStore.createLead,
  updateLead: crmStore.updateLead,
  moveLead: crmStore.moveLead,
  deleteLead: crmStore.deleteLead,
  addActivity: crmStore.addActivity,
  clearAll: crmStore.clearAll,
  refresh: crmStore.refresh,
  dismissError: crmStore.dismissError,
};
