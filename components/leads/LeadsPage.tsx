'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useCrm } from '@/components/providers/CrmProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageBadge } from '@/components/ui/StageBadge';
import { SOURCE_LABELS, type Lead, type LeadQuery } from '@/lib/domain/lead';
import { applyQuery } from '@/lib/db/sorting';
import { LeadFilters } from './LeadFilters';
import { formatMoney, formatSince, today } from '@/lib/format';
import { LeadForm } from './LeadForm';

export function LeadsPage() {
  const { leads, loading, currency, createLead, updateLead, deleteLead } = useCrm();
  const router = useRouter();
  const search = useSearchParams();

  const [creating, setCreating] = useState(search.get('new') === '1');
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [query, setQuery] = useState<LeadQuery>({ sort: 'recent' });
  // The same function the repositories use, so the list on screen can
  // never disagree with what a query would have returned.
  const visible = useMemo(() => applyQuery(leads, query), [leads, query]);
  const now = today();

  function closeCreate(): void {
    setCreating(false);
    if (search.get('new') === '1') router.replace('/leads');
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Leads"
        description={loading ? 'Reading the pipeline…' : `${leads.length} in total.`}
        action={
          <button type="button" onClick={() => setCreating(true)} className="button-primary">
            <Plus aria-hidden="true" size={16} />
            Add a lead
          </button>
        }
      />

      {!loading && leads.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No leads yet"
          description="Add the first one. Everything on the dashboard is computed from what is here."
          action={
            <button type="button" onClick={() => setCreating(true)} className="button-primary">
              <Plus aria-hidden="true" size={16} />
              Add a lead
            </button>
          }
        />
      ) : null}

      {leads.length > 0 ? (
        <LeadFilters
          query={query}
          onChange={setQuery}
          resultCount={visible.length}
          totalCount={leads.length}
        />
      ) : null}

      {leads.length > 0 && visible.length === 0 ? (
        <EmptyState
          title="No lead matches this view"
          description="Clear the filters, or widen the search, to see the pipeline again."
          action={
            <button type="button" onClick={() => setQuery({ sort: query.sort })} className="button-quiet">
              Clear filters
            </button>
          }
        />
      ) : null}

      {visible.length > 0 ? (
        <div className="card overflow-x-auto" tabIndex={0} role="region" aria-label="Leads">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <caption className="sr-only">Every lead</caption>
            <thead>
              <tr className="bg-paper">
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Lead</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Stage</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Source</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Value</th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium">Last contact</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((lead) => (
                <tr key={lead.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <Link href={`/leads/${lead.id}`} className="font-medium underline-offset-2 hover:underline">
                      {lead.name}
                    </Link>
                    <p className="text-muted">{lead.company ?? 'No company'}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-4 py-2.5 text-muted">{SOURCE_LABELS[lead.source]}</td>
                  <td className="tabular px-4 py-2.5 text-right font-medium">
                    {formatMoney(lead.valueCents, currency)}
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {formatSince(lead.lastContactAt, now)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(lead)}
                        className="rounded-lg p-1.5 hover:bg-paper"
                      >
                        <Pencil aria-hidden="true" size={16} />
                        <span className="sr-only">Edit {lead.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(lead)}
                        className="rounded-lg p-1.5 text-bad hover:bg-paper"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        <span className="sr-only">Delete {lead.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={creating} title="Add a lead" onClose={closeCreate}>
        <LeadForm
          currency={currency}
          onCancel={closeCreate}
          onSubmit={async (input) => {
            await createLead(input);
            closeCreate();
          }}
        />
      </Modal>

      <Modal open={editing !== null} title={`Edit ${editing?.name ?? ''}`} onClose={() => setEditing(null)}>
        {editing ? (
          <LeadForm
            lead={editing}
            currency={currency}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              await updateLead(editing.id, input);
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'this lead'}?`}
        message="The lead and its whole history go together, and this cannot be undone."
        confirmLabel="Delete the lead"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) void deleteLead(target.id);
        }}
      />
    </div>
  );
}
