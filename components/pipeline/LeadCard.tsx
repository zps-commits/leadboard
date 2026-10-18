'use client';

import Link from 'next/link';
import { GripVertical } from 'lucide-react';
import { STAGES, STAGE_LABELS, type Lead, type Stage } from '@/lib/domain/lead';
import { formatMoney, formatSince, type CurrencyCode } from '@/lib/format';

/**
 * A card that can be dragged, and moved without a mouse.
 *
 * The select is not a fallback bolted on afterwards: it is the same
 * action, always visible, and it is what makes the board usable with a
 * keyboard, a screen reader or a thumb on a phone.
 */
export function LeadCard({
  lead,
  currency,
  today,
  onMove,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  lead: Lead;
  currency: CurrencyCode;
  today: string;
  onMove: (stage: Stage) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', lead.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`card p-3 ${dragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/leads/${lead.id}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {lead.name}
          </Link>
          <p className="truncate text-sm text-muted">{lead.company ?? 'No company'}</p>
          <p className="tabular mt-1 text-sm font-medium">
            {formatMoney(lead.valueCents, currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{formatSince(lead.lastContactAt, today)}</p>

          <label className="mt-2 block">
            <span className="sr-only">Move {lead.name} to another stage</span>
            <select
              value={lead.stage}
              onChange={(event) => onMove(event.target.value as Stage)}
              className="w-full rounded-lg border border-line bg-surface px-2 py-1 text-xs"
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </li>
  );
}
