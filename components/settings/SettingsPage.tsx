'use client';

import { useState } from 'react';
import { Download, Database, Trash2, Sparkles } from 'lucide-react';
import { useCrm } from '@/components/providers/CrmProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { DATA_MODE, IS_DEMO } from '@/lib/config';
import { demoActivities, demoLeads } from '@/lib/demo/pipeline';
import { downloadCsv, leadsToCsv } from '@/lib/export/csv';
import { formatMoney, type CurrencyCode } from '@/lib/format';

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'BRL', label: 'Brazilian real' },
  { value: 'USD', label: 'US dollar' },
];

export function SettingsPage() {
  const { leads, currency, setCurrency, clearAll, createLead, addActivity, refresh } = useCrm();
  const [clearing, setClearing] = useState(false);
  const [filling, setFilling] = useState(false);

  async function loadExample(): Promise<void> {
    setFilling(true);
    try {
      const created = [];
      for (const input of demoLeads()) created.push(await createLead(input));
      for (const activity of demoActivities(created)) await addActivity(activity);
      await refresh();
    } finally {
      setFilling(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title="Settings" description="How figures are shown, and what is stored where." />

      <section aria-labelledby="currency-heading" className="card p-4 sm:p-5">
        <h2 id="currency-heading" className="font-semibold">
          Currency
        </h2>
        <p className="text-sm text-muted">
          This changes how amounts are written, nothing else. Values are stored as a number and
          are never converted between currencies — a deal entered as {formatMoney(450_000, 'BRL')}{' '}
          shows as {formatMoney(450_000, 'USD')} under the dollar, because it is the same number
          relabelled.
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">Currency</legend>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                  currency === option.value ? 'border-ink bg-ink text-surface' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="currency"
                  value={option.value}
                  checked={currency === option.value}
                  onChange={() => setCurrency(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section aria-labelledby="export-heading" className="card p-4 sm:p-5">
        <h2 id="export-heading" className="font-semibold">
          Export
        </h2>
        <p className="text-sm text-muted">
          Every lead as a CSV file, with amounts as plain decimals so a spreadsheet reads them as
          numbers.
        </p>
        <button
          type="button"
          disabled={leads.length === 0}
          onClick={() => downloadCsv('leadboard-leads.csv', leadsToCsv(leads))}
          className="button-primary mt-3"
        >
          <Download aria-hidden="true" size={16} />
          Export {leads.length} leads
        </button>
      </section>

      <section aria-labelledby="storage-heading" className="card p-4 sm:p-5">
        <h2 id="storage-heading" className="flex items-center gap-2 font-semibold">
          <Database aria-hidden="true" size={16} />
          Where this data lives
        </h2>
        {IS_DEMO ? (
          <p className="mt-1 text-sm text-muted">
            <strong className="font-medium text-ink">Demonstration mode.</strong> Your leads are
            kept in this browser alone. They are not sent to a server, they are not visible to
            anyone else, and they will not follow you to another device. Clearing your browser
            data removes them.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            <strong className="font-medium text-ink">Local database.</strong> Leads are written to
            a SQLite file on this machine through the server. Nothing leaves it.
          </p>
        )}
        <p className="mt-2 text-xs text-muted">Mode: {DATA_MODE}</p>
      </section>

      <section aria-labelledby="data-heading" className="card p-4 sm:p-5">
        <h2 id="data-heading" className="font-semibold">
          Example data
        </h2>
        <p className="text-sm text-muted">
          Eight invented leads with some history, to see the tool with something in it. The people
          and companies are made up and the addresses are on example.com.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadExample()} disabled={filling} className="button-quiet">
            <Sparkles aria-hidden="true" size={16} />
            {filling ? 'Adding…' : 'Add the example pipeline'}
          </button>
          <button
            type="button"
            onClick={() => setClearing(true)}
            disabled={leads.length === 0}
            className="button-quiet text-bad"
          >
            <Trash2 aria-hidden="true" size={16} />
            Clear everything
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={clearing}
        title="Clear every lead?"
        message={`All ${leads.length} leads and their history will be removed. This cannot be undone, and it is not limited to the example data.`}
        confirmLabel="Clear everything"
        onCancel={() => setClearing(false)}
        onConfirm={() => {
          setClearing(false);
          void clearAll();
        }}
      />
    </div>
  );
}
