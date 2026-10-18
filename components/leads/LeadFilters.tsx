'use client';

import { Search, X } from 'lucide-react';
import { SOURCES, SOURCE_LABELS, STAGES, STAGE_LABELS, type LeadQuery } from '@/lib/domain/lead';
import { inputClass } from '@/components/ui/Field';

/**
 * Filters that say what they are doing.
 *
 * The chips are checkboxes with the input visually hidden, so the
 * focus ring has to be put back on the label: otherwise tabbing moves
 * focus onto something nobody can see.
 *
 * Nothing ticked means no restriction, which is stated on the control
 * rather than left for the person to infer from an empty list.
 */
export function LeadFilters({
  query,
  onChange,
  resultCount,
  totalCount,
}: {
  query: LeadQuery;
  onChange: (next: LeadQuery) => void;
  resultCount: number;
  totalCount: number;
}) {
  const stages = query.stages ?? [];
  const sources = query.sources ?? [];
  const active = Boolean(query.search) || stages.length > 0 || sources.length > 0;

  const toggle = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  return (
    <section aria-labelledby="filters-heading" className="card p-4">
      <h2 id="filters-heading" className="sr-only">
        Search and filters
      </h2>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor="lead-search" className="block text-sm font-medium">
            Search
          </label>
          <div className="relative mt-1.5">
            <Search
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              id="lead-search"
              type="search"
              value={query.search ?? ''}
              onChange={(event) => onChange({ ...query, search: event.target.value })}
              placeholder="Name or company"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div className="min-w-0">
          <label htmlFor="lead-sort" className="block text-sm font-medium">
            Order
          </label>
          <select
            id="lead-sort"
            value={query.sort ?? 'recent'}
            onChange={(event) => onChange({ ...query, sort: event.target.value as LeadQuery['sort'] })}
            className={`${inputClass} mt-1.5`}
          >
            <option value="recent">Recently changed</option>
            <option value="oldest">Oldest first</option>
            <option value="value-high">Highest value</option>
            <option value="value-low">Lowest value</option>
            <option value="name">Name</option>
          </select>
        </div>

        {active ? (
          <button
            type="button"
            onClick={() => onChange({ sort: query.sort })}
            className="button-quiet ml-auto"
          >
            <X aria-hidden="true" size={15} />
            Clear filters
          </button>
        ) : null}
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">
          Stage{' '}
          <span className="font-normal text-muted">
            {stages.length === 0 ? '— all six' : `— ${stages.length} chosen`}
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const on = stages.includes(stage);
            return (
              <label
                key={stage}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                  on ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange({ ...query, stages: toggle(stages, stage) })}
                  className="sr-only"
                />
                {STAGE_LABELS[stage]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className="text-sm font-medium">
          Source{' '}
          <span className="font-normal text-muted">
            {sources.length === 0 ? '— all' : `— ${sources.length} chosen`}
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SOURCES.map((source) => {
            const on = sources.includes(source);
            return (
              <label
                key={source}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                  on ? 'border-ink bg-ink text-surface' : 'border-line bg-surface'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange({ ...query, sources: toggle(sources, source) })}
                  className="sr-only"
                />
                {SOURCE_LABELS[source]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p aria-live="polite" className="mt-3 text-sm text-muted">
        {active
          ? `Showing ${resultCount} of ${totalCount} leads.`
          : `Showing all ${totalCount} leads.`}
      </p>
    </section>
  );
}
