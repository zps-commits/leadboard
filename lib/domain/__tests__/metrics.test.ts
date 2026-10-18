import { describe, expect, it } from 'vitest';
import type { Lead, Stage } from '../lead';
import { calculateMetrics, goingCold, shiftDay } from '../metrics';

let counter = 0;
const lead = (stage: Stage, valueCents: number, overrides: Partial<Lead> = {}): Lead => {
  counter += 1;
  return {
    id: `l-${counter}`,
    name: `Lead ${counter}`,
    company: null,
    email: null,
    phone: null,
    source: 'referral',
    service: null,
    valueCents,
    stage,
    notes: null,
    lastContactAt: null,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
    ...overrides,
  };
};

describe('calculateMetrics', () => {
  const leads = [
    lead('new', 100_000),
    lead('proposal', 200_000),
    lead('negotiation', 300_000),
    lead('won', 400_000),
    lead('lost', 500_000),
  ];

  it('counts the pipeline without the deals that are already decided', () => {
    const metrics = calculateMetrics(leads);
    expect(metrics.total).toBe(5);
    expect(metrics.open).toBe(3);
    expect(metrics.pipelineValueCents).toBe(600_000);
    expect(metrics.wonValueCents).toBe(400_000);
    expect(metrics.lostValueCents).toBe(500_000);
  });

  it('expresses the win rate out of decided deals, in hundredths of a percent', () => {
    expect(calculateMetrics(leads).winRateBasisPoints).toBe(5000);
  });

  it('refuses a win rate when nothing has been decided', () => {
    expect(calculateMetrics([lead('new', 100)]).winRateBasisPoints).toBeNull();
  });

  it('reports no average rather than zero with no open deals', () => {
    expect(calculateMetrics([lead('won', 100)]).averageOpenDealCents).toBeNull();
    expect(calculateMetrics([]).averageOpenDealCents).toBeNull();
  });

  it('lists every stage, including the empty ones', () => {
    const metrics = calculateMetrics([lead('new', 100)]);
    expect(metrics.byStage).toHaveLength(6);
    expect(metrics.byStage.find((entry) => entry.stage === 'won')).toEqual({
      stage: 'won',
      count: 0,
      valueCents: 0,
    });
  });
});

describe('goingCold', () => {
  it('finds open leads untouched for a fortnight, oldest first', () => {
    const leads = [
      lead('new', 100, { lastContactAt: '2026-03-01' }),
      lead('proposal', 100, { lastContactAt: '2026-02-01' }),
      lead('negotiation', 100, { lastContactAt: '2026-03-16' }),
      lead('won', 100, { lastContactAt: '2026-01-01' }),
    ];
    const cold = goingCold(leads, '2026-03-17');
    expect(cold.map((item) => item.lastContactAt)).toEqual(['2026-02-01', '2026-03-01']);
  });

  it('counts a lead never contacted from the day it was created', () => {
    const fresh = lead('new', 100, { createdAt: '2026-03-16T12:00:00.000Z' });
    const stale = lead('new', 100, { createdAt: '2026-01-16T12:00:00.000Z' });
    expect(goingCold([fresh, stale], '2026-03-17').map((item) => item.id)).toEqual([stale.id]);
  });
});

describe('shiftDay', () => {
  it('crosses a month boundary', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });
});
