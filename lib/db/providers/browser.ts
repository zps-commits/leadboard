import { SOURCES, STAGES, type Activity, type Lead } from '@/lib/domain/lead';
import { MemoryLeadRepository, emptyState, type MemoryState } from './memory';

/**
 * The store behind the deployed demonstration.
 *
 * It lives in the visitor's own browser. That is the honest shape for a
 * public demo: a serverless instance has no disk that survives, and one
 * shared server store would show every visitor every other visitor's
 * leads. Here each person gets their own, nothing is sent anywhere, and
 * clearing it is a button.
 *
 * Storage is treated as hostile: anything in it may have been written
 * by an older version of this app or edited by hand, so every record is
 * checked field by field on the way in.
 */

export const STORAGE_KEY = 'leadboard.v1';

type Stored = { version: 1; leads: unknown[]; activities: unknown[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const nullableStr = (value: unknown): string | null => (typeof value === 'string' ? value : null);

function readLead(value: unknown): Lead | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const name = str(value.name);
  const stage = str(value.stage);
  const source = str(value.source);
  const createdAt = str(value.createdAt);
  const updatedAt = str(value.updatedAt);
  if (!id || !name || !createdAt || !updatedAt) return null;
  if (!stage || !STAGES.includes(stage as Lead['stage'])) return null;
  if (!source || !SOURCES.includes(source as Lead['source'])) return null;

  const valueCents = value.valueCents;
  if (typeof valueCents !== 'number' || !Number.isInteger(valueCents) || valueCents < 0) return null;

  return {
    id,
    name,
    company: nullableStr(value.company),
    email: nullableStr(value.email),
    phone: nullableStr(value.phone),
    source: source as Lead['source'],
    service: nullableStr(value.service),
    valueCents,
    stage: stage as Lead['stage'],
    notes: nullableStr(value.notes),
    lastContactAt: nullableStr(value.lastContactAt),
    createdAt,
    updatedAt,
  };
}

const KINDS: Activity['kind'][] = ['note', 'contact', 'stage-change', 'follow-up'];

function readActivity(value: unknown, leadIds: Set<string>): Activity | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const leadId = str(value.leadId);
  const kind = str(value.kind);
  const body = str(value.body);
  const occurredOn = str(value.occurredOn);
  const createdAt = str(value.createdAt);
  if (!id || !leadId || !body || !occurredOn || !createdAt) return null;
  if (!kind || !KINDS.includes(kind as Activity['kind'])) return null;
  // An activity whose lead is gone is dropped rather than shown against
  // nothing.
  if (!leadIds.has(leadId)) return null;

  const fromStage = nullableStr(value.fromStage);
  const toStage = nullableStr(value.toStage);
  return {
    id,
    leadId,
    kind: kind as Activity['kind'],
    body,
    fromStage: fromStage && STAGES.includes(fromStage as Lead['stage']) ? (fromStage as Lead['stage']) : null,
    toStage: toStage && STAGES.includes(toStage as Lead['stage']) ? (toStage as Lead['stage']) : null,
    occurredOn,
    createdAt,
  };
}

export function parseState(raw: string | null): MemoryState {
  if (!raw) return emptyState();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyState();
  }
  if (!isRecord(parsed) || parsed.version !== 1) return emptyState();

  const leadsRaw = Array.isArray(parsed.leads) ? parsed.leads : [];
  const leads = leadsRaw.map(readLead).filter((lead): lead is Lead => lead !== null);
  const leadIds = new Set(leads.map((lead) => lead.id));

  const activitiesRaw = Array.isArray(parsed.activities) ? parsed.activities : [];
  const activities = activitiesRaw
    .map((item) => readActivity(item, leadIds))
    .filter((activity): activity is Activity => activity !== null);

  return { leads, activities };
}

export function serialiseState(state: MemoryState): string {
  const stored: Stored = { version: 1, leads: state.leads, activities: state.activities };
  return JSON.stringify(stored);
}

/** A repository over localStorage. Every write saves the whole state. */
export function createBrowserRepository(storage: Storage): MemoryLeadRepository {
  let state: MemoryState;
  try {
    state = parseState(storage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing and blocked site data both throw on access.
    state = emptyState();
  }

  return new MemoryLeadRepository(
    state,
    () => new Date(),
    () => crypto.randomUUID(),
    (next) => {
      try {
        storage.setItem(STORAGE_KEY, serialiseState(next));
      } catch {
        // Out of quota or storage denied: the session keeps working in
        // memory rather than failing the user's edit.
      }
    },
  );
}
