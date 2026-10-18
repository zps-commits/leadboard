import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { SOURCES, STAGES } from '@/lib/domain/lead';

/**
 * The stored shape.
 *
 * Money is an integer column, never a float: a REAL column would make
 * the pipeline total drift by a cent for no reason anyone could trace.
 * Stage and source are constrained to the domain's own lists, so a bad
 * value cannot be written even by a hand-typed SQL statement.
 */

export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    company: text('company'),
    email: text('email'),
    phone: text('phone'),
    source: text('source', { enum: SOURCES }).notNull(),
    service: text('service'),
    valueCents: integer('value_cents').notNull().default(0),
    stage: text('stage', { enum: STAGES }).notNull(),
    notes: text('notes'),
    lastContactAt: text('last_contact_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('leads_stage_idx').on(table.stage), index('leads_name_idx').on(table.name)],
);

export const activities = sqliteTable(
  'activities',
  {
    id: text('id').primaryKey(),
    leadId: text('lead_id')
      .notNull()
      // Deleting a lead takes its history with it: a loose activity row
      // would point at a lead nobody can open.
      .references(() => leads.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['note', 'contact', 'stage-change', 'follow-up'] }).notNull(),
    body: text('body').notNull(),
    fromStage: text('from_stage', { enum: STAGES }),
    toStage: text('to_stage', { enum: STAGES }),
    occurredOn: text('occurred_on').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('activities_lead_idx').on(table.leadId)],
);

export type LeadRow = typeof leads.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
