import { describe, expect, it } from 'vitest';
import type { Lead } from '@/lib/domain/lead';
import { escapeCell, leadsToCsv } from '../csv';

const lead: Lead = {
  id: 'a',
  name: 'Ana Ribeiro',
  company: 'Núcleo Design, Lda',
  email: 'ana@example.com',
  phone: '+55 81 90000-0001',
  source: 'referral',
  service: 'Brand website',
  valueCents: 450_000,
  stage: 'proposal',
  notes: 'Two\nlines',
  lastContactAt: '2026-03-17',
  createdAt: '2026-03-01T12:00:00.000Z',
  updatedAt: '2026-03-17T12:00:00.000Z',
};

describe('escapeCell', () => {
  it('disarms a cell a spreadsheet would run as a formula', () => {
    expect(escapeCell('=1+1')).toBe("'=1+1");
    expect(escapeCell('+55 81 90000-0001')).toBe("'+55 81 90000-0001");
    expect(escapeCell('-5')).toBe("'-5");
    expect(escapeCell('@everyone')).toBe("'@everyone");
  });

  it('quotes commas, quotes and newlines', () => {
    expect(escapeCell('a, b')).toBe('"a, b"');
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCell('two\nlines')).toBe('"two\nlines"');
  });
});

describe('leadsToCsv', () => {
  it('writes money as a plain decimal and keeps the note intact', () => {
    const lines = leadsToCsv([lead]).split('\n');
    expect(lines[0]).toBe('name,company,email,phone,source,service,value,stage,last_contact,notes,created_at');
    expect(lines[1]).toContain('"Núcleo Design, Lda"');
    expect(lines[1]).toContain('4500.00');
    expect(lines[1]).toContain("'+55 81 90000-0001");
    expect(leadsToCsv([lead])).toContain('"Two\nlines"');
  });

  it('writes the header even with nothing to export', () => {
    expect(leadsToCsv([]).split('\n')).toHaveLength(1);
  });

  it('writes the stage and source as words, not as codes', () => {
    expect(leadsToCsv([lead])).toContain('Proposal sent');
    expect(leadsToCsv([lead])).toContain('Referral');
  });
});
