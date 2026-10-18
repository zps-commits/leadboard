import 'server-only';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { migrate } from './migrate';
import { openDatabase, SqliteLeadRepository } from './providers/sqlite';
import type { LeadRepository } from './repository';

/**
 * The single database handle for the local store.
 *
 * Next reloads modules in development, so the handle is kept on
 * globalThis: opening a new connection per reload leaks file handles
 * and eventually locks the database against itself.
 */

const globalForDb = globalThis as unknown as { leadboardRepository?: LeadRepository };

function create(): LeadRepository {
  const file = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'leadboard.db');
  mkdirSync(path.dirname(file), { recursive: true });
  const db = openDatabase(file);
  migrate(db);
  return new SqliteLeadRepository(db);
}

export function getRepository(): LeadRepository {
  globalForDb.leadboardRepository ??= create();
  return globalForDb.leadboardRepository;
}
