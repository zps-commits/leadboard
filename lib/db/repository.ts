import type {
  Activity,
  ActivityInput,
  Lead,
  LeadInput,
  LeadQuery,
  Stage,
} from '@/lib/domain/lead';

/**
 * One contract, two implementations.
 *
 * Locally the app writes to SQLite through a server action. On a
 * serverless host a file on disk is not storage — the next request may
 * run on another machine, and anything written would silently vanish —
 * so the deployed demonstration uses a browser-backed store instead and
 * says so on screen. Both satisfy this interface and both are held to
 * the same contract test.
 */
export interface LeadRepository {
  listLeads(query?: LeadQuery): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  createLead(input: LeadInput): Promise<Lead>;
  updateLead(id: string, input: LeadInput): Promise<Lead>;
  /** Records the move in the history as well as on the lead. */
  moveLead(id: string, stage: Stage): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  listActivities(leadId?: string, limit?: number): Promise<Activity[]>;
  addActivity(input: ActivityInput): Promise<Activity>;

  /** Removes every lead and activity. Used by the demo reset only. */
  clear(): Promise<void>;
}

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`No lead with id ${id}.`);
    this.name = 'NotFoundError';
  }
}
