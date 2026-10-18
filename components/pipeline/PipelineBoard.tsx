'use client';

import { useState } from 'react';
import { Columns3 } from 'lucide-react';
import { useCrm } from '@/components/providers/CrmProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { STAGES, STAGE_LABELS, type Stage } from '@/lib/domain/lead';
import { formatMoney, formatCount, today } from '@/lib/format';
import { LeadCard } from './LeadCard';

const COLUMN_ACCENT: Record<Stage, string> = {
  new: 'bg-stage-new',
  qualifying: 'bg-stage-qualifying',
  proposal: 'bg-stage-proposal',
  negotiation: 'bg-stage-negotiation',
  won: 'bg-stage-won',
  lost: 'bg-stage-lost',
};

export function PipelineBoard() {
  const { leads, loading, currency, moveLead } = useCrm();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const now = today();

  async function move(id: string, stage: Stage): Promise<void> {
    const lead = leads.find((item) => item.id === id);
    if (!lead || lead.stage === stage) return;
    await moveLead(id, stage);
    // Said out loud, because a card silently appearing in a different
    // column is not feedback to anyone who cannot see the board.
    setAnnouncement(`${lead.name} moved to ${STAGE_LABELS[stage]}.`);
  }

  if (loading) return <p className="p-6 text-muted">Reading the pipeline…</p>;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Pipeline"
        description="Drag a card between columns, or use the menu on the card — both do the same thing."
      />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {leads.length === 0 ? (
        <EmptyState
          icon={<Columns3 size={22} />}
          title="The board is empty"
          description="Add a lead and it will appear in the column of the stage you chose."
        />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-4">
            {STAGES.map((stage) => {
              const column = leads.filter((lead) => lead.stage === stage);
              const total = column.reduce((sum, lead) => sum + lead.valueCents, 0);
              return (
                <section
                  key={stage}
                  aria-labelledby={`column-${stage}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setOver(stage);
                  }}
                  onDragLeave={() => setOver((current) => (current === stage ? null : current))}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData('text/plain');
                    setOver(null);
                    setDragging(null);
                    if (id) void move(id, stage);
                  }}
                  className={`w-72 shrink-0 rounded-xl border p-3 ${
                    over === stage ? 'border-ink bg-surface' : 'border-line bg-paper'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className={`size-2.5 rounded-full ${COLUMN_ACCENT[stage]}`} />
                    <h2 id={`column-${stage}`} className="mr-auto text-sm font-semibold">
                      {STAGE_LABELS[stage]}
                    </h2>
                    <span className="tabular text-xs text-muted">
                      {formatCount(column.length, currency)}
                    </span>
                  </div>
                  <p className="tabular mt-0.5 text-xs text-muted">
                    {formatMoney(total, currency)}
                  </p>

                  {column.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-dashed border-line p-3 text-xs text-muted">
                      Nothing here yet.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {column.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          currency={currency}
                          today={now}
                          dragging={dragging === lead.id}
                          onDragStart={() => setDragging(lead.id)}
                          onDragEnd={() => setDragging(null)}
                          onMove={(next) => void move(lead.id, next)}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
