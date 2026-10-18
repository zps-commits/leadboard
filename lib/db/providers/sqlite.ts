import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
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
import { activities, leads, type ActivityRow, type LeadRow } from '../schema';

/**
 * The local store: a real SQLite file through Drizzle.
 *
 * This is the one that persists. It runs where there is a disk that
 * survives between requests, which on a serverless host there is not.
 */

type Db = BetterSQLite3Database<Record<string, never>>;

export function openDatabase(file: string): Database.Database {
  const db = new Database(file);
  // Write-ahead logging, and foreign keys actually enforced — SQLite
  // leaves them off by default, which would quietly allow an activity
  // to outlive its lead.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    source: row.source,
    service: row.service,
    valueCents: row.valueCents,
    stage: row.stage,
    notes: row.notes,
    lastContactAt: row.lastContactAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    leadId: row.leadId,
    kind: row.kind,
    body: row.body,
    fromStage: row.fromStage,
    toStage: row.toStage,
    occurredOn: row.occurredOn,
    createdAt: row.createdAt,
  };
}

export class SqliteLeadRepository implements LeadRepository {
  private readonly db: Db;

  constructor(
    connection: Database.Database,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {
    this.db = drizzle(connection);
  }

  private stamp(): string {
    return this.now().toISOString();
  }

  async listLeads(query: LeadQuery = {}): Promise<Lead[]> {
    const where = [];
    if (query.stages && query.stages.length > 0) where.push(inArray(leads.stage, query.stages));
    if (query.sources && query.sources.length > 0) where.push(inArray(leads.source, query.sources));
    const rows = await (where.length > 0
      ? this.db.select().from(leads).where(and(...where))
      : this.db.select().from(leads));

    // The text search runs in TypeScript rather than in SQL. SQLite's
    // LIKE folds case for ASCII only, so "Núcleo" would not match
    // "nucleo" and the two providers would answer the same query
    // differently — exactly what the shared contract test exists to
    // prevent. A freelancer's pipeline is small enough for this.
    return applyQuery(rows.map(toLead), { search: query.search, sort: query.sort });
  }

  async getLead(id: string): Promise<Lead | null> {
    const [row] = await this.db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return row ? toLead(row) : null;
  }

  async createLead(input: LeadInput): Promise<Lead> {
    const at = this.stamp();
    const lead: Lead = { ...input, id: this.newId(), createdAt: at, updatedAt: at };
    await this.db.insert(leads).values(lead);
    await this.db.insert(activities).values({
      id: this.newId(),
      leadId: lead.id,
      kind: 'note',
      body: `Lead created in ${STAGE_LABELS[lead.stage]}.`,
      fromStage: null,
      toStage: null,
      occurredOn: at.slice(0, 10),
      createdAt: at,
    });
    return lead;
  }

  async updateLead(id: string, input: LeadInput): Promise<Lead> {
    const existing = await this.getLead(id);
    if (!existing) throw new NotFoundError(id);

    const at = this.stamp();
    const updated: Lead = { ...existing, ...input, id, createdAt: existing.createdAt, updatedAt: at };
    await this.db.update(leads).set({ ...input, updatedAt: at }).where(eq(leads.id, id));

    if (existing.stage !== updated.stage) {
      await this.db.insert(activities).values({
        id: this.newId(),
        leadId: id,
        kind: 'stage-change',
        body: `Moved from ${STAGE_LABELS[existing.stage]} to ${STAGE_LABELS[updated.stage]}.`,
        fromStage: existing.stage,
        toStage: updated.stage,
        occurredOn: at.slice(0, 10),
        createdAt: at,
      });
    }
    return updated;
  }

  async moveLead(id: string, stage: Stage): Promise<Lead> {
    const existing = await this.getLead(id);
    if (!existing) throw new NotFoundError(id);
    if (existing.stage === stage) return existing;
    return this.updateLead(id, { ...existing, stage });
  }

  async deleteLead(id: string): Promise<void> {
    const existing = await this.getLead(id);
    if (!existing) throw new NotFoundError(id);
    // The cascade on activities.lead_id takes the history with it.
    await this.db.delete(leads).where(eq(leads.id, id));
  }

  async listActivities(leadId?: string, limit = 50): Promise<Activity[]> {
    const rows = await (leadId
      ? this.db.select().from(activities).where(eq(activities.leadId, leadId))
      : this.db.select().from(activities));

    return rows
      .map(toActivity)
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
    await this.db.insert(activities).values(activity);

    if (input.kind === 'contact' && (lead.lastContactAt === null || input.occurredOn > lead.lastContactAt)) {
      await this.db
        .update(leads)
        .set({ lastContactAt: input.occurredOn, updatedAt: at })
        .where(eq(leads.id, input.leadId));
    }
    return activity;
  }

  async clear(): Promise<void> {
    await this.db.delete(activities);
    await this.db.delete(leads);
  }
}
