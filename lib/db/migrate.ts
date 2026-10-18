import 'server-only';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';

/**
 * Applies the generated migrations in order, once each.
 *
 * Drizzle's own migrator is fine, but this keeps the applied list in a
 * table we can read and makes the local setup a single function the app
 * can call on boot without a build step.
 */
export function migrate(db: Database.Database, directory = path.join(process.cwd(), 'drizzle')): string[] {
  db.exec(
    'create table if not exists _migrations (name text primary key, applied_at text not null)',
  );
  const applied = new Set(
    db.prepare('select name from _migrations').all().map((row) => (row as { name: string }).name),
  );

  const files = readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const run: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(directory, file), 'utf8');
    // One transaction per file: a half-applied migration is the worst
    // state to find a database in.
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare('insert into _migrations (name, applied_at) values (?, ?)').run(
        file,
        new Date().toISOString(),
      );
    });
    apply();
    run.push(file);
  }
  return run;
}
