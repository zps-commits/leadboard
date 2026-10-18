import { describe, expect, it } from 'vitest';
import type { LeadInput } from '@/lib/domain/lead';
import { NotFoundError, type LeadRepository } from '../repository';

/**
 * One suite, run against every provider.
 *
 * The browser store and the SQLite store answer the same questions in
 * the deployed demonstration and on a developer's machine. If they ever
 * differ, the difference shows up here rather than in a user's pipeline.
 */

export const sampleLead = (overrides: Partial<LeadInput> = {}): LeadInput => ({
  name: 'Ana Ribeiro',
  company: 'Núcleo Design',
  email: 'ana@example.com',
  phone: '+55 81 90000-0000',
  source: 'referral',
  service: 'Brand site',
  valueCents: 450_000,
  stage: 'new',
  notes: null,
  lastContactAt: null,
  ...overrides,
});

export function runRepositoryContract(
  name: string,
  makeRepository: () => Promise<LeadRepository> | LeadRepository,
): void {
  const open = async () => makeRepository();

  describe(`${name}: leads`, () => {
    it('creates a lead and reads it back whole', async () => {
      const repository = await open();
      const created = await repository.createLead(sampleLead());

      expect(created.id).toBeTruthy();
      expect(created.valueCents).toBe(450_000);
      expect(await repository.getLead(created.id)).toEqual(created);
    });

    it('records the creation in the history', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());
      const history = await repository.listActivities(lead.id);

      expect(history).toHaveLength(1);
      expect(history[0]?.body).toContain('New contact');
    });

    it('updates a lead without rewriting when it was created', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());
      const updated = await repository.updateLead(lead.id, {
        ...sampleLead(),
        name: 'Ana Ribeiro Costa',
        valueCents: 500_000,
      });

      expect(updated.name).toBe('Ana Ribeiro Costa');
      expect(updated.createdAt).toBe(lead.createdAt);
      expect(await repository.getLead(lead.id)).toEqual(updated);
    });

    it('writes a stage change into the history, with both stages', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());
      await repository.moveLead(lead.id, 'proposal');

      const history = await repository.listActivities(lead.id);
      const move = history.find((activity) => activity.kind === 'stage-change');
      expect(move?.fromStage).toBe('new');
      expect(move?.toStage).toBe('proposal');
    });

    it('does not record a move to the stage the lead is already in', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());
      await repository.moveLead(lead.id, 'new');

      const history = await repository.listActivities(lead.id);
      expect(history.filter((activity) => activity.kind === 'stage-change')).toHaveLength(0);
    });

    it('deletes a lead and its history together', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());
      await repository.deleteLead(lead.id);

      expect(await repository.getLead(lead.id)).toBeNull();
      expect(await repository.listActivities(lead.id)).toEqual([]);
    });

    it('refuses to touch a lead that does not exist', async () => {
      const repository = await open();
      await expect(repository.updateLead('missing', sampleLead())).rejects.toBeInstanceOf(NotFoundError);
      await expect(repository.deleteLead('missing')).rejects.toBeInstanceOf(NotFoundError);
      await expect(repository.moveLead('missing', 'won')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe(`${name}: searching and filtering`, () => {
    const seed = async (repository: LeadRepository) => {
      await repository.createLead(sampleLead({ name: 'Ana Ribeiro', company: 'Núcleo Design', valueCents: 450_000 }));
      await repository.createLead(
        sampleLead({ name: 'Bruno Lima', company: 'Oficina Verde', source: 'website', stage: 'proposal', valueCents: 120_000 }),
      );
      await repository.createLead(
        sampleLead({ name: 'Carla Souza', company: null, source: 'event', stage: 'won', valueCents: 980_000 }),
      );
    };

    it('matches a name or a company, ignoring case and accents', async () => {
      const repository = await open();
      await seed(repository);

      expect((await repository.listLeads({ search: 'ana' })).map((lead) => lead.name)).toEqual(['Ana Ribeiro']);
      expect((await repository.listLeads({ search: 'nucleo' })).map((lead) => lead.name)).toEqual(['Ana Ribeiro']);
      expect((await repository.listLeads({ search: 'VERDE' })).map((lead) => lead.name)).toEqual(['Bruno Lima']);
    });

    it('filters by stage and by source, and combines the two', async () => {
      const repository = await open();
      await seed(repository);

      expect(await repository.listLeads({ stages: ['won'] })).toHaveLength(1);
      expect(await repository.listLeads({ sources: ['website', 'event'] })).toHaveLength(2);
      expect(await repository.listLeads({ stages: ['won'], sources: ['website'] })).toHaveLength(0);
    });

    it('treats an empty filter as no restriction', async () => {
      const repository = await open();
      await seed(repository);
      expect(await repository.listLeads({ stages: [], sources: [], search: '' })).toHaveLength(3);
    });

    it('orders by value and by name', async () => {
      const repository = await open();
      await seed(repository);

      expect((await repository.listLeads({ sort: 'value-high' })).map((lead) => lead.valueCents)).toEqual([
        980_000, 450_000, 120_000,
      ]);
      expect((await repository.listLeads({ sort: 'name' })).map((lead) => lead.name)).toEqual([
        'Ana Ribeiro',
        'Bruno Lima',
        'Carla Souza',
      ]);
    });
  });

  describe(`${name}: activities`, () => {
    it('moves the last contact date forward when a contact is recorded', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());

      await repository.addActivity({
        leadId: lead.id,
        kind: 'contact',
        body: 'Call about the proposal',
        occurredOn: '2026-03-17',
      });
      expect((await repository.getLead(lead.id))?.lastContactAt).toBe('2026-03-17');

      // An older contact typed in later must not drag the date backwards.
      await repository.addActivity({
        leadId: lead.id,
        kind: 'contact',
        body: 'Forgot to log this one',
        occurredOn: '2026-02-02',
      });
      expect((await repository.getLead(lead.id))?.lastContactAt).toBe('2026-03-17');
    });

    it('leaves the contact date alone for a note', async () => {
      const repository = await open();
      const lead = await repository.createLead(sampleLead());
      await repository.addActivity({
        leadId: lead.id,
        kind: 'note',
        body: 'Wants the quote in euros',
        occurredOn: '2026-03-17',
      });
      expect((await repository.getLead(lead.id))?.lastContactAt).toBeNull();
    });

    it('refuses an activity on a lead that does not exist', async () => {
      const repository = await open();
      await expect(
        repository.addActivity({ leadId: 'missing', kind: 'note', body: 'x', occurredOn: '2026-03-17' }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('lists the whole history newest first when no lead is named', async () => {
      const repository = await open();
      const first = await repository.createLead(sampleLead({ name: 'Ana Ribeiro' }));
      const second = await repository.createLead(sampleLead({ name: 'Bruno Lima' }));
      await repository.addActivity({ leadId: first.id, kind: 'note', body: 'older', occurredOn: '2026-01-02' });
      await repository.addActivity({ leadId: second.id, kind: 'note', body: 'newer', occurredOn: '2026-05-02' });

      const all = await repository.listActivities();
      expect(all.length).toBeGreaterThanOrEqual(4);
      // Asserted as an ordering property rather than a fixed first row:
      // each provider stamps its own activities with its own clock.
      const dates = all.map((activity) => activity.occurredOn);
      expect([...dates].sort().reverse()).toEqual(dates);
      expect(dates.indexOf('2026-05-02')).toBeLessThan(dates.indexOf('2026-01-02'));
    });
  });

  describe(`${name}: clearing`, () => {
    it('removes everything', async () => {
      const repository = await open();
      await repository.createLead(sampleLead());
      await repository.clear();

      expect(await repository.listLeads()).toEqual([]);
      expect(await repository.listActivities()).toEqual([]);
    });
  });
}
