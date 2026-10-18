'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Flame, HandCoins, Handshake, Plus, Send, Trophy, Users, XCircle } from 'lucide-react';
import { useCrm } from '@/components/providers/CrmProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StageBadge } from '@/components/ui/StageBadge';
import { ACTIVITY_LABELS, STAGE_LABELS } from '@/lib/domain/lead';
import { calculateMetrics, goingCold } from '@/lib/domain/metrics';
import { formatCount, formatDay, formatMoney, formatRate, formatSince, today } from '@/lib/format';

export function Dashboard() {
  const { leads, activities, loading, currency } = useCrm();
  const metrics = useMemo(() => calculateMetrics(leads), [leads]);
  const now = today();
  const cold = useMemo(() => goingCold(leads, now).slice(0, 5), [leads, now]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-muted">Reading the pipeline…</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <PageHeader title="Dashboard" description="Where the pipeline stands today." />
        <EmptyState
          icon={<Users size={22} />}
          title="No leads yet"
          description="Add the first one and the figures here will be computed from it. Nothing on this page is a placeholder."
          action={
            <Link href="/leads?new=1" className="button-primary">
              <Plus aria-hidden="true" size={16} />
              Add a lead
            </Link>
          }
        />
      </div>
    );
  }

  const cards = [
    { label: 'Leads', value: formatCount(metrics.total, currency), note: `${formatCount(metrics.open, currency)} still open`, icon: Users },
    { label: 'In negotiation', value: formatCount(metrics.inNegotiation, currency), note: 'being talked through', icon: Handshake },
    { label: 'Proposals sent', value: formatCount(metrics.proposalsSent, currency), note: 'waiting on an answer', icon: Send },
    { label: 'Won', value: formatCount(metrics.won, currency), note: `${formatMoney(metrics.wonValueCents, currency)} closed`, icon: Trophy },
    { label: 'Lost', value: formatCount(metrics.lost, currency), note: `win rate ${formatRate(metrics.winRateBasisPoints)}`, icon: XCircle },
    {
      label: 'Pipeline value',
      value: formatMoney(metrics.pipelineValueCents, currency),
      note:
        metrics.averageOpenDealCents === null
          ? 'no open deals'
          : `${formatMoney(metrics.averageOpenDealCents, currency)} average open deal`,
      icon: HandCoins,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description="Every figure here is counted from the leads themselves."
        action={
          <Link href="/leads?new=1" className="button-primary">
            <Plus aria-hidden="true" size={16} />
            Add a lead
          </Link>
        }
      />

      <section aria-labelledby="figures-heading">
        <h2 id="figures-heading" className="sr-only">
          Headline figures
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="card min-w-0 p-4">
              <p className="flex items-center gap-2 text-sm text-muted">
                <card.icon aria-hidden="true" size={16} />
                {card.label}
              </p>
              <p className="tabular mt-1.5 text-2xl font-semibold break-words">{card.value}</p>
              <p className="mt-0.5 text-sm text-muted">{card.note}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <section aria-labelledby="stages-heading" className="card p-4 sm:p-5">
          <h2 id="stages-heading" className="font-semibold">
            Where the leads are
          </h2>
          <p className="text-sm text-muted">Count and value held in each stage.</p>
          <table className="mt-4 w-full border-collapse text-sm">
            <caption className="sr-only">Leads and value by stage</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-line py-2 text-left font-medium">Stage</th>
                <th scope="col" className="border-b border-line py-2 text-right font-medium">Leads</th>
                <th scope="col" className="border-b border-line py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {metrics.byStage.map((entry) => (
                <tr key={entry.stage}>
                  <th scope="row" className="border-b border-line py-2 text-left font-normal">
                    <StageBadge stage={entry.stage} />
                  </th>
                  <td className="tabular border-b border-line py-2 text-right">
                    {formatCount(entry.count, currency)}
                  </td>
                  <td className="tabular border-b border-line py-2 text-right">
                    {formatMoney(entry.valueCents, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted">
            Won and lost deals are counted here but kept out of the pipeline value: money already
            decided is not a forecast.
          </p>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="cold-heading" className="card p-4 sm:p-5">
            <h2 id="cold-heading" className="flex items-center gap-2 font-semibold">
              <Flame aria-hidden="true" size={16} className="text-stage-proposal" />
              Going cold
            </h2>
            <p className="text-sm text-muted">
              Open leads with no contact recorded in the last fortnight.
            </p>
            {cold.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Nothing is waiting. Every open lead has been contacted in the last two weeks.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {cold.map((lead) => (
                  <li key={lead.id} className="flex flex-wrap items-center gap-2 py-2">
                    <Link href={`/leads/${lead.id}`} className="mr-auto font-medium underline-offset-2 hover:underline">
                      {lead.name}
                    </Link>
                    <StageBadge stage={lead.stage} />
                    <span className="text-sm text-muted">{formatSince(lead.lastContactAt, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="recent-heading" className="card p-4 sm:p-5">
            <h2 id="recent-heading" className="font-semibold">
              Recent activity
            </h2>
            {activities.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {activities.slice(0, 8).map((activity) => {
                  const lead = leads.find((item) => item.id === activity.leadId);
                  return (
                    <li key={activity.id} className="py-2">
                      <p className="text-sm">
                        <span className="font-medium">{lead?.name ?? 'A lead'}</span>{' '}
                        <span className="text-muted">— {activity.body}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {ACTIVITY_LABELS[activity.kind]}
                        {activity.toStage ? ` to ${STAGE_LABELS[activity.toStage]}` : ''} ·{' '}
                        {formatDay(activity.occurredOn, currency)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
