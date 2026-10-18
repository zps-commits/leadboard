import { describe, expect, it } from 'vitest';
import { leadInputSchema, parseAmountToCents } from '../validation';

const base = {
  name: 'Ana Ribeiro',
  company: 'Núcleo Design',
  email: 'ANA@Example.com ',
  phone: '+55 81 90000-0000',
  source: 'referral',
  service: 'Brand site',
  valueCents: 450_000,
  stage: 'new',
  notes: '',
  lastContactAt: '',
};

describe('leadInputSchema', () => {
  it('trims, lowercases the address and turns blanks into null', () => {
    const parsed = leadInputSchema.parse(base);
    expect(parsed.email).toBe('ana@example.com');
    expect(parsed.notes).toBeNull();
    expect(parsed.lastContactAt).toBeNull();
  });

  it('insists on a name', () => {
    expect(leadInputSchema.safeParse({ ...base, name: '   ' }).success).toBe(false);
  });

  it('refuses an address that is not one, rather than storing it anyway', () => {
    expect(leadInputSchema.safeParse({ ...base, email: 'ana at example' }).success).toBe(false);
  });

  it('refuses a phone number with too few digits', () => {
    expect(leadInputSchema.safeParse({ ...base, phone: '123' }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...base, phone: '(81) 9000-0000' }).success).toBe(true);
  });

  it('refuses a stage or source outside the lists', () => {
    expect(leadInputSchema.safeParse({ ...base, stage: 'maybe' }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...base, source: 'telepathy' }).success).toBe(false);
  });

  it('refuses an amount that is negative or not whole cents', () => {
    expect(leadInputSchema.safeParse({ ...base, valueCents: -1 }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...base, valueCents: 10.5 }).success).toBe(false);
  });

  it('refuses a date that does not exist', () => {
    expect(leadInputSchema.safeParse({ ...base, lastContactAt: '2026-02-30' }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...base, lastContactAt: '17/03/2026' }).success).toBe(false);
    expect(leadInputSchema.safeParse({ ...base, lastContactAt: '2026-03-17' }).success).toBe(true);
  });
});

describe('parseAmountToCents', () => {
  it('reads both number cultures', () => {
    expect(parseAmountToCents('1.234,56')).toEqual({ ok: true, cents: 123_456 });
    expect(parseAmountToCents('1,234.56')).toEqual({ ok: true, cents: 123_456 });
    expect(parseAmountToCents('R$ 4.500,00')).toEqual({ ok: true, cents: 450_000 });
  });

  it('treats a blank as nothing rather than as an error', () => {
    expect(parseAmountToCents('   ')).toEqual({ ok: true, cents: 0 });
  });

  it('refuses text', () => {
    expect(parseAmountToCents('about five grand').ok).toBe(false);
  });
});
