import { beforeEach, describe, expect, it } from 'vitest';
import { createBrowserRepository, parseState, serialiseState, STORAGE_KEY } from '../providers/browser';
import { runRepositoryContract, sampleLead } from './repositoryContract';

class FakeStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

runRepositoryContract('browser', () => createBrowserRepository(new FakeStorage()));

describe('browser storage', () => {
  let storage: FakeStorage;
  beforeEach(() => {
    storage = new FakeStorage();
  });

  it('keeps the leads across a reload', async () => {
    const first = createBrowserRepository(storage);
    await first.createLead(sampleLead({ name: 'Ana Ribeiro' }));

    const second = createBrowserRepository(storage);
    expect((await second.listLeads()).map((lead) => lead.name)).toEqual(['Ana Ribeiro']);
  });

  it('starts empty rather than throwing when the stored value is nonsense', () => {
    expect(parseState('not json')).toEqual({ leads: [], activities: [] });
    expect(parseState(JSON.stringify({ version: 99, leads: [{}] }))).toEqual({
      leads: [],
      activities: [],
    });
  });

  it('drops a record that has been tampered with, and keeps the rest', () => {
    const good = {
      id: 'a',
      name: 'Ana',
      company: null,
      email: null,
      phone: null,
      source: 'referral',
      service: null,
      valueCents: 1000,
      stage: 'new',
      notes: null,
      lastContactAt: null,
      createdAt: '2026-03-17T12:00:00.000Z',
      updatedAt: '2026-03-17T12:00:00.000Z',
    };
    const state = parseState(
      JSON.stringify({
        version: 1,
        leads: [good, { ...good, id: 'b', stage: 'maybe' }, { ...good, id: 'c', valueCents: -5 }],
        activities: [],
      }),
    );
    expect(state.leads.map((lead) => lead.id)).toEqual(['a']);
  });

  it('drops an activity whose lead is gone', () => {
    const state = parseState(
      JSON.stringify({
        version: 1,
        leads: [],
        activities: [
          {
            id: 'x',
            leadId: 'missing',
            kind: 'note',
            body: 'orphan',
            occurredOn: '2026-03-17',
            createdAt: '2026-03-17T12:00:00.000Z',
          },
        ],
      }),
    );
    expect(state.activities).toEqual([]);
  });

  it('keeps working when storage refuses to be written to', async () => {
    const readOnly = new FakeStorage();
    readOnly.setItem = () => {
      throw new Error('quota');
    };
    const repository = createBrowserRepository(readOnly);
    await expect(repository.createLead(sampleLead())).resolves.toMatchObject({ name: 'Ana Ribeiro' });
  });

  it('writes under a versioned key', async () => {
    const repository = createBrowserRepository(storage);
    await repository.createLead(sampleLead());
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}').version).toBe(1);
    expect(serialiseState({ leads: [], activities: [] })).toContain('"version":1');
  });
});
