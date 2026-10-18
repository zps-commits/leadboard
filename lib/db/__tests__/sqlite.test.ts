// @vitest-environment node
import { afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { migrate } from '../migrate';
import { openDatabase, SqliteLeadRepository } from '../providers/sqlite';
import { runRepositoryContract } from './repositoryContract';

/**
 * The same contract against a real SQLite file, created and thrown away
 * per test. An in-memory SQLite would skip the file handling, which is
 * the part most likely to be wrong.
 */
const directory = mkdtempSync(path.join(tmpdir(), 'leadboard-'));
const open = [] as { close(): void }[];
let tick = 0;

afterAll(() => {
  for (const db of open) db.close();
  rmSync(directory, { recursive: true, force: true });
});

runRepositoryContract('sqlite', () => {
  tick += 1;
  const db = openDatabase(path.join(directory, `test-${tick}.db`));
  open.push(db);
  migrate(db);
  let moment = 0;
  return new SqliteLeadRepository(
    db,
    () => new Date(Date.UTC(2026, 2, 17, 12, 0, (moment += 1))),
    () => `id-${tick}-${moment}-${Math.random().toString(36).slice(2, 8)}`,
  );
});
