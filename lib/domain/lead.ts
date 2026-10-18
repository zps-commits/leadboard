/**
 * The vocabulary of the pipeline.
 *
 * Money is an integer number of cents everywhere, and a date that means
 * a day is a civil date string: a deal was worth R$ 4.500,00 on the 17th
 * of March, not at an instant in some timezone.
 */

export const STAGES = [
  'new',
  'qualifying',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New contact',
  qualifying: 'Qualifying',
  proposal: 'Proposal sent',
  negotiation: 'Negotiation',
  won: 'Closed won',
  lost: 'Lost',
};

/** The two stages that take a lead out of the open pipeline. */
export const CLOSED_STAGES: Stage[] = ['won', 'lost'];

export const SOURCES = [
  'referral',
  'website',
  'social',
  'outbound',
  'event',
  'marketplace',
  'other',
] as const;

export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  referral: 'Referral',
  website: 'Website',
  social: 'Social media',
  outbound: 'Outbound',
  event: 'Event',
  marketplace: 'Marketplace',
  other: 'Other',
};

export type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: Source;
  service: string | null;
  /** What the deal is expected to be worth, in cents. */
  valueCents: number;
  stage: Stage;
  notes: string | null;
  /** A civil date, "2026-03-17", or null when never contacted. */
  lastContactAt: string | null;
  /** ISO instants: these are events in the system, not calendar days. */
  createdAt: string;
  updatedAt: string;
};

export type ActivityKind = 'note' | 'contact' | 'stage-change' | 'follow-up';

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  note: 'Note',
  contact: 'Contact made',
  'stage-change': 'Stage changed',
  'follow-up': 'Follow-up',
};

export type Activity = {
  id: string;
  leadId: string;
  kind: ActivityKind;
  body: string;
  /** Set only on a stage change, so the history can be read back. */
  fromStage: Stage | null;
  toStage: Stage | null;
  /** The civil date the activity happened or is due on. */
  occurredOn: string;
  createdAt: string;
};

export type LeadInput = {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: Source;
  service: string | null;
  valueCents: number;
  stage: Stage;
  notes: string | null;
  lastContactAt: string | null;
};

export type ActivityInput = {
  leadId: string;
  kind: ActivityKind;
  body: string;
  occurredOn: string;
};

export type LeadQuery = {
  /** Matched against name and company, case insensitive. */
  search?: string;
  stages?: Stage[];
  sources?: Source[];
  sort?: 'recent' | 'oldest' | 'value-high' | 'value-low' | 'name';
};
