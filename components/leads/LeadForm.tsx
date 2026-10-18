'use client';

import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Field, inputClass } from '@/components/ui/Field';
import {
  SOURCES,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  type Lead,
  type LeadInput,
} from '@/lib/domain/lead';
import { leadInputSchema, parseAmountToCents } from '@/lib/domain/validation';
import { formatMoney, type CurrencyCode } from '@/lib/format';

type Props = {
  lead?: Lead;
  currency: CurrencyCode;
  onSubmit: (input: LeadInput) => Promise<unknown>;
  onCancel: () => void;
};

type Errors = Partial<Record<keyof LeadInput | 'form', string>>;

/**
 * The form keeps raw strings, not numbers.
 *
 * Parsing on every keystroke rewrites what the person is typing — the
 * moment they type "4.5" it becomes "4,5" or "450" under their cursor.
 * The value is read once, on submit, by the same schema the server runs.
 */
export function LeadForm({ lead, currency, onSubmit, onCancel }: Props) {
  const baseId = useId();
  const field = (name: string) => `${baseId}-${name}`;

  const [values, setValues] = useState({
    name: lead?.name ?? '',
    company: lead?.company ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    source: lead?.source ?? 'referral',
    service: lead?.service ?? '',
    amount: lead ? (lead.valueCents / 100).toFixed(2) : '',
    stage: lead?.stage ?? 'new',
    notes: lead?.notes ?? '',
    lastContactAt: lead?.lastContactAt ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof values) => (value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (saving) return;

    const amount = parseAmountToCents(values.amount);
    if (!amount.ok) {
      setErrors({ valueCents: amount.message });
      return;
    }

    const parsed = leadInputSchema.safeParse({
      ...values,
      valueCents: amount.cents,
      company: values.company,
      service: values.service,
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        // An issue with no field attached still has to be shown. A
        // rejection nobody can see looks exactly like a dead button.
        if (typeof key === 'string') next[key as keyof LeadInput] = issue.message;
        else next.form = issue.message;
      }
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } catch (cause) {
      setErrors({ form: cause instanceof Error ? cause.message : 'That could not be saved.' });
      setSaving(false);
    }
  }

  const described = (name: keyof LeadInput) =>
    errors[name] ? `${field(name)}-error` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form ? (
        <p role="alert" className="rounded-lg border border-bad/40 bg-bad/5 p-3 text-sm text-bad">
          {errors.form}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id={field('name')} label="Name" error={errors.name}>
          <input
            id={field('name')}
            value={values.name}
            onChange={(event) => set('name')(event.target.value)}
            aria-describedby={described('name')}
            aria-invalid={errors.name ? true : undefined}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field id={field('company')} label="Company" error={errors.company}>
          <input
            id={field('company')}
            value={values.company}
            onChange={(event) => set('company')(event.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field id={field('email')} label="Email" error={errors.email}>
          <input
            id={field('email')}
            type="email"
            value={values.email}
            onChange={(event) => set('email')(event.target.value)}
            aria-describedby={described('email')}
            aria-invalid={errors.email ? true : undefined}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field id={field('phone')} label="Phone" error={errors.phone}>
          <input
            id={field('phone')}
            type="tel"
            value={values.phone}
            onChange={(event) => set('phone')(event.target.value)}
            aria-describedby={described('phone')}
            aria-invalid={errors.phone ? true : undefined}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field id={field('source')} label="Where they came from">
          <select
            id={field('source')}
            value={values.source}
            onChange={(event) => set('source')(event.target.value)}
            className={inputClass}
          >
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
        </Field>

        <Field id={field('service')} label="Service of interest" error={errors.service}>
          <input
            id={field('service')}
            value={values.service}
            onChange={(event) => set('service')(event.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </Field>

        <Field
          id={field('valueCents')}
          label="Estimated value"
          error={errors.valueCents}
          hint={`In ${currency}. Both 4.500,00 and 4500.00 are understood.`}
        >
          <input
            id={field('valueCents')}
            inputMode="decimal"
            value={values.amount}
            onChange={(event) => set('amount')(event.target.value)}
            aria-describedby={
              errors.valueCents ? `${field('valueCents')}-error` : `${field('valueCents')}-hint`
            }
            aria-invalid={errors.valueCents ? true : undefined}
            className={inputClass}
            placeholder={formatMoney(0, currency)}
          />
        </Field>

        <Field id={field('stage')} label="Stage">
          <select
            id={field('stage')}
            value={values.stage}
            onChange={(event) => set('stage')(event.target.value)}
            className={inputClass}
          >
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={field('lastContactAt')}
          label="Last contacted"
          error={errors.lastContactAt}
          hint="Leave blank if you have not spoken yet."
        >
          <input
            id={field('lastContactAt')}
            type="date"
            value={values.lastContactAt}
            onChange={(event) => set('lastContactAt')(event.target.value)}
            aria-describedby={described('lastContactAt')}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id={field('notes')} label="Notes" error={errors.notes}>
        <textarea
          id={field('notes')}
          value={values.notes}
          onChange={(event) => set('notes')(event.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="button-primary" disabled={saving}>
          {saving ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : null}
          {lead ? 'Save changes' : 'Add the lead'}
        </button>
        <button type="button" onClick={onCancel} className="button-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}
