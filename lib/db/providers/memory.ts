import {
  STAGE_LABELS,
  type Activity,
  type ActivityInput,
  type Lead,
  type LeadInput,
  type LeadQuery,
  type Stage,
} from '@/lib/domain/lead';
import { NotFoundError, type LeadRepository } from '../repository';
import { applyQuery } from '../sorting';

/**
 * An in-process store.
 *
 * It backs the tests and the browser store below it. It is never used
 * as the storage of a deployed server: a serverless instance can vanish
 * between two requests, and a write that disappears without a word is
 * worse than no write at all.
 */

export type MemoryState = { leads: Lead[]; activities: Activity[] };

export function emptyState(): MemoryState {
  return { leads: [], activities: [] };
}

export type Clock = () => Date;
export type IdFactory = () => string;

export class MemoryLeadRepository implements LeadRepository {
  constructor(
    private state: MemoryState = emptyState(),
    private readonly now: Clock = () => new Date(),
    private readonly newId: IdFactory = () => crypto.randomUUID(),
    private readonly onChange: (state: MemoryState) => void = () => {},
  ) {}

  private commit(): void {
    this.onChange(this.state);
  }

  private stamp(): string {
    return this.now().toISOString();
  }

  async listLeads(query: LeadQuery = {}): Promise<Lead[]> {
    return applyQuery(this.state.leads, query);
  }

  async getLead(id: string): Promise<Lead | null> {
    return this.state.leads.find((lead) => lead.id === id) ?? null;
  }

  async createLead(input: LeadInput): Promise<Lead> {
    const at = this.stamp();
    const lead: Lead = { ...input, id: this.newId(), createdAt: at, updatedAt: at };
    this.state.leads.push(lead);
    this.state.activities.push(this.buildActivity('note', `Lead created in ${STAGE_LABELS[lead.stage]}.`, lead.id, at));
    this.commit();
    return lead;
  }

  async updateLead(id: string, input: LeadInput): Promise<Lead> {
    const index = this.state.leads.findIndex((lead) => lead.id === id);
    const existing = this.state.leads[index];
    if (index === -1 || !existing) throw new NotFoundError(id);

    const at = this.stamp();
    const updated: Lead = { ...existing, ...input, id: existing.id, createdAt: existing.createdAt, updatedAt: at };
    this.state.leads[index] = updated;

    // A stage changed through the form is still a stage change, and the
    // history is the only place anyone can see when it happened.
    if (existing.stage !== updated.stage) {
      this.state.activities.push(
        this.buildActivity(
          'stage-change',
          `Moved from ${STAGE_LABELS[existing.stage]} to ${STAGE_LABELS[updated.stage]}.`,
          id,
          at,
          existing.stage,
          updated.stage,
        ),
      );
    }
    this.commit();
    return updated;
  }

  async moveLead(id: string, stage: Stage): Promise<Lead> {
    const existing = await this.getLead(id);
    if (!existing) throw new NotFoundError(id);
    if (existing.stage === stage) return existing;
    return this.updateLead(id, { ...existing, stage });
  }

  async deleteLead(id: string): Promise<void> {
    const before = this.state.leads.length;
    this.state.leads = this.state.leads.filter((lead) => lead.id !== id);
    if (this.state.leads.length === before) throw new NotFoundError(id);
    // The history goes with the lead; an activity pointing at a lead
    // nobody can open is not history, it is litter.
    this.state.activities = this.state.activities.filter((activity) => activity.leadId !== id);
    this.commit();
  }

  async listActivities(leadId?: string, limit = 50): Promise<Activity[]> {
    return this.state.activities
      .filter((activity) => (leadId ? activity.leadId === leadId : true))
      .sort(
        (a, b) =>
          b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt),
      )
      .slice(0, limit);
  }

  async addActivity(input: ActivityInput): Promise<Activity> {
    const lead = await this.getLead(input.leadId);
    if (!lead) throw new NotFoundError(input.leadId);

    const at = this.stamp();
    const activity: Activity = {
      id: this.newId(),
      leadId: input.leadId,
      kind: input.kind,
      body: input.body,
      fromStage: null,
      toStage: null,
      occurredOn: input.occurredOn,
      createdAt: at,
    };
    this.state.activities.push(activity);

    // Recording a contact is what "last contacted" means; keeping the
    // two apart would let the date go stale while the history filled up.
    if (input.kind === 'contact') {
      const index = this.state.leads.findIndex((item) => item.id === input.leadId);
      const existing = this.state.leads[index];
      if (existing && (existing.lastContactAt === null || input.occurredOn > existing.lastContactAt)) {
        this.state.leads[index] = { ...existing, lastContactAt: input.occurredOn, updatedAt: at };
      }
    }
    this.commit();
    return activity;
  }

  async clear(): Promise<void> {
    this.state = emptyState();
    this.commit();
  }

  /** Used by the browser store to hand over a loaded state. */
  replace(state: MemoryState): void {
    this.state = state;
  }

  snapshot(): MemoryState {
    return this.state;
  }

  private buildActivity(
    kind: Activity['kind'],
    body: string,
    leadId: string,
    at: string,
    fromStage: Stage | null = null,
    toStage: Stage | null = null,
  ): Activity {
    return {
      id: this.newId(),
      leadId,
      kind,
      body,
      fromStage,
      toStage,
      occurredOn: at.slice(0, 10),
      createdAt: at,
    };
  }
}
