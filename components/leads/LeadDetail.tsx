'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useCrm } from '@/components/providers/CrmProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { StageBadge } from '@/components/ui/StageBadge';
import { Field, inputClass } from '@/components/ui/Field';
import {
  ACTIVITY_LABELS,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  type ActivityKind,
} from '@/lib/domain/lead';
import { formatDay, formatMoney, formatSince, today } from '@/lib/format';
import { LeadForm } from './LeadForm';

const KINDS: ActivityKind[] = ['contact', 'note', 'follow-up'];

export function LeadDetail({ id }: { id: string }) {
  const { leads, activities, loading, currency, updateLead, deleteLead, moveLead, addActivity } =
    useCrm();
  const router = useRouter();

  const lead = leads.find((item) => item.id === id);
  const history = useMemo(
    () => activities.filter((activity) => activity.leadId === id),
    [activities, id],
  );

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [kind, setKind] = useState<ActivityKind>('contact');
  const [body, setBody] = useState('');
  const [occurredOn, setOccurredOn] = useState(today());
  const [activityError, setActivityError] = useState<string | null>(null);

  if (loading) return <p className="p-6 text-muted">Reading the pipeline…</p>;

  if (!lead) {
    return (
      <div className="p-4 sm:p-6">
        <p className="font-medium">That lead is not here.</p>
        <p className="mt-1 text-muted">
          It may have been deleted, or the link may be from another browser — in demonstration
          mode the leads live in the browser that created them.
        </p>
        <Link href="/leads" className="button-quiet mt-4">
          <ArrowLeft aria-hidden="true" size={16} />
          Back to the leads
        </Link>
      </div>
    );
  }

  const details: { label: string; value: string }[] = [
    { label: 'Company', value: lead.company ?? 'Not given' },
    { label: 'Service', value: lead.service ?? 'Not given' },
    { label: 'Source', value: SOURCE_LABELS[lead.source] },
    { label: 'Estimated value', value: formatMoney(lead.valueCents, currency) },
    { label: 'Last contact', value: formatSince(lead.lastContactAt, today()) },
    { label: 'Added', value: formatDay(lead.createdAt.slice(0, 10), currency) },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden="true" size={15} />
        All leads
      </Link>

      <div className="flex flex-wrap items-start gap-3 border-b border-line pb-4">
        <div className="mr-auto min-w-0">
          <h1 className="text-xl font-semibold">{lead.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <StageBadge stage={lead.stage} />
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-ink">
                <Mail aria-hidden="true" size={14} />
                {lead.email}
              </a>
            ) : null}
            {lead.phone ? (
              <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:text-ink">
                <Phone aria-hidden="true" size={14} />
                {lead.phone}
              </a>
            ) : null}
          </div>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="button-quiet">
          <Pencil aria-hidden="true" size={16} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="button-quiet text-bad"
        >
          <Trash2 aria-hidden="true" size={16} />
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <section aria-labelledby="details-heading" className="card p-4 sm:p-5">
            <h2 id="details-heading" className="font-semibold">
              Details
            </h2>
            <dl className="mt-3 divide-y divide-line text-sm">
              {details.map((detail) => (
                <div key={detail.label} className="flex flex-wrap justify-between gap-2 py-2">
                  <dt className="text-muted">{detail.label}</dt>
                  <dd className="font-medium">{detail.value}</dd>
                </div>
              ))}
            </dl>
            {lead.notes ? (
              <p className="mt-3 border-t border-line pt-3 text-sm whitespace-pre-line">
                {lead.notes}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="stage-heading" className="card p-4 sm:p-5">
            <h2 id="stage-heading" className="font-semibold">
              Move to another stage
            </h2>
            <p className="text-sm text-muted">
              Each move is written into the history below, with the stage it came from.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  disabled={stage === lead.stage}
                  onClick={() => void moveLead(lead.id, stage)}
                  aria-current={stage === lead.stage ? 'true' : undefined}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    stage === lead.stage
                      ? 'border-ink bg-ink text-surface'
                      : 'border-line hover:bg-paper'
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section aria-labelledby="history-heading" className="card p-4 sm:p-5">
          <h2 id="history-heading" className="font-semibold">
            History
          </h2>

          <form
            className="mt-3 space-y-3 border-b border-line pb-4"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = body.trim();
              if (trimmed === '') {
                setActivityError('Write what happened before saving it.');
                return;
              }
              setActivityError(null);
              setBody('');
              void addActivity({ leadId: lead.id, kind, body: trimmed, occurredOn });
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="activity-kind" label="What happened">
                <select
                  id="activity-kind"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as ActivityKind)}
                  className={inputClass}
                >
                  {KINDS.map((option) => (
                    <option key={option} value={option}>
                      {ACTIVITY_LABELS[option]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="activity-date" label="On">
                <input
                  id="activity-date"
                  type="date"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="activity-body" label="Details" error={activityError ?? undefined}>
              <textarea
                id="activity-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={2}
                className={inputClass}
                aria-invalid={activityError ? true : undefined}
                aria-describedby={activityError ? 'activity-body-error' : undefined}
              />
            </Field>
            <p className="text-xs text-muted">
              Recording a contact also moves this lead&apos;s last-contact date forward.
            </p>
            <button type="submit" className="button-primary">
              <Plus aria-hidden="true" size={16} />
              Add to the history
            </button>
          </form>

          {history.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing recorded yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {history.map((activity) => (
                <li key={activity.id} className="border-l-2 border-line pl-3">
                  <p className="text-sm">{activity.body}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ACTIVITY_LABELS[activity.kind]}
                    {activity.fromStage && activity.toStage
                      ? `: ${STAGE_LABELS[activity.fromStage]} → ${STAGE_LABELS[activity.toStage]}`
                      : ''}{' '}
                    · {formatDay(activity.occurredOn, currency)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <Modal open={editing} title={`Edit ${lead.name}`} onClose={() => setEditing(false)}>
        <LeadForm
          lead={lead}
          currency={currency}
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await updateLead(lead.id, input);
            setEditing(false);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleting}
        title={`Delete ${lead.name}?`}
        message="The lead and its whole history go together, and this cannot be undone."
        confirmLabel="Delete the lead"
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false);
          void deleteLead(lead.id).then(() => router.push('/leads'));
        }}
      />
    </div>
  );
}
