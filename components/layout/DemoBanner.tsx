import { Info } from 'lucide-react';
import { IS_DEMO } from '@/lib/config';

/**
 * Said once, where it cannot be missed. A demonstration that looks
 * like a product and loses the work on the next device is a trap.
 */
export function DemoBanner() {
  if (!IS_DEMO) return null;

  return (
    <p className="flex items-start gap-2 border-b border-line bg-surface px-4 py-2 text-sm text-muted sm:px-6">
      <Info aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
      <span>
        <strong className="font-medium text-ink">Demonstration.</strong> Leads are kept in this
        browser only — not on a server, and not on your other devices. Running it locally stores
        them in SQLite instead.
      </span>
    </p>
  );
}
