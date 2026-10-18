import type { ActivityInput, Lead, LeadInput } from '@/lib/domain/lead';

/**
 * An invented pipeline, used to seed the local database and to fill
 * the deployed demonstration on first visit.
 *
 * Nobody here is real. The companies are made up, the addresses are on
 * example.com — a domain reserved for documentation — and the phone
 * numbers are not allocated to anyone. No figure here is presented as
 * a result anyone achieved.
 */

function daysAgo(days: number, from = new Date()): string {
  const date = new Date(from.getTime());
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function demoLeads(): LeadInput[] {
  return [
    {
      name: 'Ana Ribeiro',
      company: 'Núcleo Design',
      email: 'ana@example.com',
      phone: '+55 81 90000-0001',
      source: 'referral',
      service: 'Brand website',
      valueCents: 450_000,
      stage: 'proposal',
      notes: 'Wants the proposal in Portuguese and a second version in English.',
      lastContactAt: daysAgo(3),
    },
    {
      name: 'Bruno Lima',
      company: 'Oficina Verde',
      email: 'bruno@example.com',
      phone: '+55 11 90000-0002',
      source: 'website',
      service: 'Online store',
      valueCents: 1_280_000,
      stage: 'negotiation',
      notes: 'Asked to split payment across three months.',
      lastContactAt: daysAgo(1),
    },
    {
      name: 'Carla Souza',
      company: 'Clínica Mandala',
      email: 'carla@example.com',
      phone: null,
      source: 'social',
      service: 'Booking system',
      valueCents: 780_000,
      stage: 'qualifying',
      notes: null,
      lastContactAt: daysAgo(9),
    },
    {
      name: 'Daniel Alves',
      company: 'Pão & Companhia',
      email: 'daniel@example.com',
      phone: '+55 81 90000-0004',
      source: 'referral',
      service: 'Digital menu',
      valueCents: 240_000,
      stage: 'won',
      notes: 'Signed; starts next month.',
      lastContactAt: daysAgo(6),
    },
    {
      name: 'Elisa Marques',
      company: 'Studio Vinte',
      email: 'elisa@example.com',
      phone: null,
      source: 'event',
      service: 'Portfolio site',
      valueCents: 320_000,
      stage: 'new',
      notes: 'Met at a meetup; wants to talk in two weeks.',
      lastContactAt: null,
    },
    {
      name: 'Felipe Dantas',
      company: 'Rota Norte Logística',
      email: 'felipe@example.com',
      phone: '+55 85 90000-0006',
      source: 'outbound',
      service: 'Internal dashboard',
      valueCents: 2_100_000,
      stage: 'qualifying',
      notes: 'Budget not confirmed yet.',
      lastContactAt: daysAgo(21),
    },
    {
      name: 'Gabriela Nunes',
      company: 'Ateliê Raiz',
      email: 'gabriela@example.com',
      phone: null,
      source: 'marketplace',
      service: 'Catalogue redesign',
      valueCents: 190_000,
      stage: 'lost',
      notes: 'Went with a cheaper quote.',
      lastContactAt: daysAgo(30),
    },
    {
      name: 'Hugo Pereira',
      company: null,
      email: 'hugo@example.com',
      phone: '+55 21 90000-0008',
      source: 'website',
      service: 'Landing page',
      valueCents: 150_000,
      stage: 'new',
      notes: null,
      lastContactAt: daysAgo(17),
    },
  ];
}

export function demoActivities(leads: Lead[]): ActivityInput[] {
  const find = (name: string) => leads.find((lead) => lead.name.startsWith(name));
  const entries: ActivityInput[] = [];

  const ana = find('Ana');
  if (ana) {
    entries.push(
      { leadId: ana.id, kind: 'contact', body: 'Call to walk through the scope.', occurredOn: daysAgo(8) },
      { leadId: ana.id, kind: 'note', body: 'Needs the site live before the fair in June.', occurredOn: daysAgo(7) },
      { leadId: ana.id, kind: 'contact', body: 'Proposal sent by email.', occurredOn: daysAgo(3) },
      { leadId: ana.id, kind: 'follow-up', body: 'Chase the proposal if there is no answer.', occurredOn: daysAgo(-2) },
    );
  }

  const bruno = find('Bruno');
  if (bruno) {
    entries.push(
      { leadId: bruno.id, kind: 'contact', body: 'Second meeting about payment terms.', occurredOn: daysAgo(1) },
      { leadId: bruno.id, kind: 'note', body: 'Wants delivery in two phases.', occurredOn: daysAgo(1) },
    );
  }

  const felipe = find('Felipe');
  if (felipe) {
    entries.push({
      leadId: felipe.id,
      kind: 'note',
      body: 'Waiting for their finance team to confirm the budget.',
      occurredOn: daysAgo(21),
    });
  }

  return entries;
}
