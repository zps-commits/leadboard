'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { useCrm } from '@/components/providers/CrmProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ACTIVITY_LABELS, STAGE_LABELS, type ActivityKind } from '@/lib/domain/lead';
import { formatDay, today } from '@/lib/format';

const KINDS: ActivityKind[] = ['contact', 'note', 'stage-change', 'follow-up'];

export function ActivityPage() {
  const { activities, leads, loading, currency } = useCrm();
  const [kinds, setKinds] = useState<ActivityKind[]>([]);
  const now = today();

  const visible = useMemo(
    () => (kinds.length === 0 ? activities : activities.filter((item) => kinds.includes(item.kind))),
    [activities, kinds],
  );

  /** Grouped by the day it happened, newest day first. */
  const days = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const activity of visible) {
      map.set(activity.occurredOn, [...(map.get(activity.occurredOn) ?? []), activity]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [visible]);

  if (loading) return <p className="p-6 text-muted">Reading the history…</p>;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Activity"
        description="Everything recorded against every lead, newest first."
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon size={22} />}
          title="Nothing recorded yet"
          description="Calls, notes and stage changes appear here as you record them on a lead."
        />
      ) : (
        <>
          <fieldset className="card p-4">
            <legend className="text-sm font-medium">
              Kind{' '}
              <span className="font-normal text-muted">
                {kinds.length === 0 ? '— everything' : `— ${kinds.length} chosen`}
              </span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {KINDS.map((kind) => {
                const on = kinds.includes(kind);
                return (
                  <label
                    key={kind}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                      on ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setKinds((previous) =>
                          previous.includes(kind)
                            ? previous.filter((item) => item !== kind)
                            : [...previous, kind],
                        )
                      }
                      className="sr-only"
                    />
                    {ACTIVITY_LABELS[kind]}
                  </label>
                );
              })}
            </div>
            <p aria-live="polite" className="mt-3 text-sm text-muted">
              {visible.length} of {activities.length} entries.
            </p>
          </fieldset>

          {days.length === 0 ? (
            <EmptyState
              title="Nothing of that kind"
              description="Choose another kind, or clear the filter, to see the history again."
            />
          ) : (
            <div className="space-y-6">
              {days.map(([day, entries]) => (
                <section key={day} aria-labelledby={`day-${day}`}>
                  <h2 id={`day-${day}`} className="text-sm font-semibold text-muted">
                    {formatDay(day, currency)}
                    {day > now ? ' · upcoming' : ''}
                  </h2>
                  <ul className="card mt-2 divide-y divide-line">
                    {entries.map((activity) => {
                      const lead = leads.find((item) => item.id === activity.leadId);
                      return (
                        <li key={activity.id} className="flex flex-wrap items-start gap-2 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{activity.body}</p>
                            <p className="mt-0.5 text-xs text-muted">
                              {ACTIVITY_LABELS[activity.kind]}
                              {activity.fromStage && activity.toStage
                                ? `: ${STAGE_LABELS[activity.fromStage]} → ${STAGE_LABELS[activity.toStage]}`
                                : ''}
                            </p>
                          </div>
                          {lead ? (
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-sm font-medium underline-offset-2 hover:underline"
                            >
                              {lead.name}
                            </Link>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
