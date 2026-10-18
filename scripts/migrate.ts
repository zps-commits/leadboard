/** Applies pending migrations to the local database. */
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { migrate } from '@/lib/db/migrate';
import { openDatabase } from '@/lib/db/providers/sqlite';

const file = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'leadboard.db');
mkdirSync(path.dirname(file), { recursive: true });

const db = openDatabase(file);
const applied = migrate(db);
console.log(
  applied.length === 0 ? `Nothing to apply; ${file} is up to date.` : `Applied: ${applied.join(', ')}`,
);
db.close();
