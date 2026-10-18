'use client';

import { getClientRepository } from '@/lib/db/client';
import type { Activity, ActivityInput, Lead, LeadInput, Stage } from '@/lib/domain/lead';

/**
 * The pipeline, held outside React.
 *
 * The first component to subscribe starts the load; everything after
 * that reads the same snapshot. Keeping it here rather than in a
 * component means no state is written from inside an effect — which
 * React 19 refuses, and rightly: it hides the real order of updates.
 */

export type CrmState = {
  leads: Lead[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
};

const EMPTY: CrmState = { leads: [], activities: [], loading: true, error: null };

let state: CrmState = EMPTY;
let loadStarted = false;
const listeners = new Set<() => void>();

function set(patch: Partial<CrmState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

async function load(): Promise<void> {
  const repository = getClientRepository();
  try {
    const [leads, activities] = await Promise.all([
      repository.listLeads(),
      repository.listActivities(undefined, 200),
    ]);
    set({ leads, activities, loading: false, error: null });
  } catch (cause) {
    set({
      loading: false,
      error: cause instanceof Error ? cause.message : 'The pipeline could not be read.',
    });
  }
}

async function write<T>(work: (repository: ReturnType<typeof getClientRepository>) => Promise<T>): Promise<T> {
  try {
    const result = await work(getClientRepository());
    await load();
    return result;
  } catch (cause) {
    set({ error: cause instanceof Error ? cause.message : 'That change could not be saved.' });
    throw cause;
  }
}

export const crmStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!loadStarted) {
      loadStarted = true;
      void load();
    }
    return () => listeners.delete(listener);
  },

  getSnapshot: (): CrmState => state,

  /** The server renders the loading state; the data arrives in the browser. */
  getServerSnapshot: (): CrmState => EMPTY,

  refresh: load,

  createLead: (input: LeadInput): Promise<Lead> => write((repository) => repository.createLead(input)),
  updateLead: (id: string, input: LeadInput): Promise<Lead> =>
    write((repository) => repository.updateLead(id, input)),
  moveLead: (id: string, stage: Stage): Promise<Lead> =>
    write((repository) => repository.moveLead(id, stage)),
  deleteLead: (id: string): Promise<void> => write((repository) => repository.deleteLead(id)),
  addActivity: (input: ActivityInput): Promise<Activity> =>
    write((repository) => repository.addActivity(input)),
  clearAll: (): Promise<void> => write((repository) => repository.clear()),

  dismissError: (): void => set({ error: null }),

  /** Tests start from a known state. */
  reset(): void {
    state = EMPTY;
    loadStarted = false;
    for (const listener of listeners) listener();
  },
};
