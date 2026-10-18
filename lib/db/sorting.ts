import type { Lead, LeadQuery } from '@/lib/domain/lead';

/**
 * Searching, filtering and ordering, written once.
 *
 * Both providers run this, so the SQLite store and the browser store
 * cannot drift into answering the same query differently.
 */

function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matchesQuery(lead: Lead, query: LeadQuery): boolean {
  if (query.stages && query.stages.length > 0 && !query.stages.includes(lead.stage)) return false;
  if (query.sources && query.sources.length > 0 && !query.sources.includes(lead.source)) {
    return false;
  }
  const search = query.search?.trim();
  if (search) {
    const needle = normalise(search);
    const haystack = normalise(`${lead.name} ${lead.company ?? ''}`);
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function sortLeads(leads: Lead[], sort: LeadQuery['sort'] = 'recent'): Lead[] {
  const copy = [...leads];
  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    case 'value-high':
      return copy.sort((a, b) => b.valueCents - a.valueCents || a.name.localeCompare(b.name));
    case 'value-low':
      return copy.sort((a, b) => a.valueCents - b.valueCents || a.name.localeCompare(b.name));
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    default:
      // Most recently touched first, which is what "recent" means to
      // someone working a pipeline: the lead they just updated.
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  }
}

export function applyQuery(leads: Lead[], query: LeadQuery = {}): Lead[] {
  return sortLeads(
    leads.filter((lead) => matchesQuery(lead, query)),
    query.sort,
  );
}
