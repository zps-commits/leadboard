import { MemoryLeadRepository } from '../providers/memory';
import { runRepositoryContract } from './repositoryContract';

let tick = 0;
runRepositoryContract(
  'memory',
  () =>
    new MemoryLeadRepository(
      { leads: [], activities: [] },
      // A fixed, advancing clock: two leads created in the same
      // millisecond would otherwise sort unpredictably.
      () => new Date(Date.UTC(2026, 2, 17, 12, 0, (tick += 1))),
      () => `id-${tick}-${Math.random().toString(36).slice(2, 8)}`,
    ),
);
