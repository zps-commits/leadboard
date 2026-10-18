import { CLOSED_STAGES, STAGES, type Activity, type Lead, type Stage } from './lead';

/**
 * What the dashboard shows, computed from the records and nothing else.
 *
 * No figure here is stored or cached. A count that can disagree with
 * the leads it counts is worse than no count.
 */

export type StageCount = { stage: Stage; count: number; valueCents: number };

export type DashboardMetrics = {
  total: number;
  /** Leads still in play: everything that is neither won nor lost. */
  open: number;
  byStage: StageCount[];
  inNegotiation: number;
  proposalsSent: number;
  won: number;
  lost: number;
  /** The value of open deals. Won money is not pipeline any more. */
  pipelineValueCents: number;
  wonValueCents: number;
  lostValueCents: number;
  /**
   * Won as a share of decided deals, in hundredths of a percent. Null
   * when nothing has been decided: a rate out of zero is not a rate.
   */
  winRateBasisPoints: number | null;
  /** Average value of an open deal, or null when there are none. */
  averageOpenDealCents: number | null;
};

export function calculateMetrics(leads: Lead[]): DashboardMetrics {
  const byStage: StageCount[] = STAGES.map((stage) => ({ stage, count: 0, valueCents: 0 }));
  const index = new Map(byStage.map((entry) => [entry.stage, entry]));

  let pipelineValueCents = 0;
  let wonValueCents = 0;
  let lostValueCents = 0;
  let open = 0;

  for (const lead of leads) {
    const entry = index.get(lead.stage);
    if (entry) {
      entry.count += 1;
      entry.valueCents += lead.valueCents;
    }
    if (lead.stage === 'won') wonValueCents += lead.valueCents;
    else if (lead.stage === 'lost') lostValueCents += lead.valueCents;
    else {
      open += 1;
      pipelineValueCents += lead.valueCents;
    }
  }

  const won = index.get('won')?.count ?? 0;
  const lost = index.get('lost')?.count ?? 0;
  const decided = won + lost;

  return {
    total: leads.length,
    open,
    byStage,
    inNegotiation: index.get('negotiation')?.count ?? 0,
    proposalsSent: index.get('proposal')?.count ?? 0,
    won,
    lost,
    pipelineValueCents,
    wonValueCents,
    lostValueCents,
    winRateBasisPoints: decided === 0 ? null : Math.round((won / decided) * 10_000),
    averageOpenDealCents: open === 0 ? null : Math.round(pipelineValueCents / open),
  };
}

export const isClosed = (stage: Stage): boolean => CLOSED_STAGES.includes(stage);

/** Leads with no contact recorded for this many days, longest first. */
export function goingCold(leads: Lead[], today: string, days = 14): Lead[] {
  const cutoff = shiftDay(today, -days);
  return leads
    .filter((lead) => !isClosed(lead.stage))
    .filter((lead) => (lead.lastContactAt ?? lead.createdAt.slice(0, 10)) <= cutoff)
    .sort((a, b) =>
      (a.lastContactAt ?? a.createdAt.slice(0, 10)).localeCompare(
        b.lastContactAt ?? b.createdAt.slice(0, 10),
      ),
    );
}

/** Civil-date arithmetic on the UTC calendar; a day is a day. */
export function shiftDay(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function recentActivity(activities: Activity[], limit = 8): Activity[] {
  return activities.slice(0, limit);
}
