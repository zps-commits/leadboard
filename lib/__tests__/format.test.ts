import { describe, expect, it } from 'vitest';
import { formatCount, formatDay, formatMoney, formatRate, formatSince } from '../format';

describe('formatMoney', () => {
  it('renders both currencies from cents', () => {
    expect(formatMoney(450_000, 'BRL').replace(/ /g, ' ')).toBe('R$ 4.500,00');
    expect(formatMoney(450_000, 'USD')).toBe('$4,500.00');
  });
});

describe('formatRate', () => {
  it('says so in words when nothing has been decided', () => {
    expect(formatRate(null)).toBe('nothing decided yet');
    expect(formatRate(5000)).toBe('50%');
  });
});

describe('formatSince', () => {
  it('says never rather than showing a dash', () => {
    expect(formatSince(null, '2026-03-17')).toBe('never contacted');
  });

  it('reads in plain words', () => {
    expect(formatSince('2026-03-17', '2026-03-17')).toBe('today');
    expect(formatSince('2026-03-16', '2026-03-17')).toBe('yesterday');
    expect(formatSince('2026-03-14', '2026-03-17')).toBe('3 days ago');
    expect(formatSince('2026-03-01', '2026-03-17')).toBe('2 weeks ago');
  });
});

describe('formatDay and formatCount', () => {
  it('formats in UTC so a civil date never slips', () => {
    expect(formatDay('2026-03-17', 'USD')).toBe('Mar 17, 2026');
    expect(formatCount(1234, 'USD')).toBe('1,234');
  });
});
