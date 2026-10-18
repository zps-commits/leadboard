/**
 * A demonstration pipeline for the local database.
 *
 * The people and companies below are invented. There are no real
 * contacts here: the email addresses are on example.com, which exists
 * for exactly this purpose, and the phone numbers are not allocated.
 *
 *   npm run db:seed
 */
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { migrate } from '@/lib/db/migrate';
import { openDatabase, SqliteLeadRepository } from '@/lib/db/providers/sqlite';
import { demoLeads, demoActivities } from '@/lib/demo/pipeline';

const file = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'leadboard.db');
mkdirSync(path.dirname(file), { recursive: true });

async function main(): Promise<void> {
  const db = openDatabase(file);
  migrate(db);

  const repository = new SqliteLeadRepository(db);
  // Seeding replaces the demonstration pipeline rather than adding to
  // it, so running it twice does not leave sixteen leads behind.
  await repository.clear();

  const created = [];
  for (const lead of demoLeads()) {
    created.push(await repository.createLead(lead));
  }
  for (const activity of demoActivities(created)) {
    await repository.addActivity(activity);
  }

  console.log(`Seeded ${created.length} leads into ${file}.`);
  db.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
