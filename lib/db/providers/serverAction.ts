import {
  addActivityAction,
  clearAction,
  createLeadAction,
  deleteLeadAction,
  getLeadAction,
  listActivitiesAction,
  listLeadsAction,
  moveLeadAction,
  updateLeadAction,
} from '@/app/actions';
import type {
  Activity,
  ActivityInput,
  Lead,
  LeadInput,
  LeadQuery,
  Stage,
} from '@/lib/domain/lead';
import type { LeadRepository } from '../repository';

/**
 * The same contract, over server actions.
 *
 * The client never holds a database handle and never sees a connection
 * string; it calls these and the server decides what is allowed.
 */
export const serverActionRepository: LeadRepository = {
  listLeads: (query?: LeadQuery): Promise<Lead[]> => listLeadsAction(query ?? {}),
  getLead: (id: string) => getLeadAction(id),
  createLead: (input: LeadInput) => createLeadAction(input),
  updateLead: (id: string, input: LeadInput) => updateLeadAction(id, input),
  moveLead: (id: string, stage: Stage) => moveLeadAction(id, stage),
  deleteLead: (id: string) => deleteLeadAction(id),
  listActivities: (leadId?: string, limit?: number): Promise<Activity[]> =>
    listActivitiesAction(leadId, limit),
  addActivity: (input: ActivityInput) => addActivityAction(input),
  clear: () => clearAction(),
};
