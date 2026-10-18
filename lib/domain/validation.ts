import { z } from 'zod';
import { SOURCES, STAGES, type LeadInput } from './lead';

/**
 * Validation lives in one place and is run on both sides of every
 * boundary. The browser form and the server action use this schema, so
 * a value can never be written by one route and refused by the other.
 */

const trimmedOptional = z
  .string()
  .trim()
  .max(200, 'Keep this under 200 characters.')
  .transform((value) => (value === '' ? null : value))
  .nullable();

const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const civilDate = z
  .string()
  .regex(CIVIL_DATE, 'Use a date in the form 2026-03-17.')
  .refine((value) => {
    const [y, m, d] = value.split('-').map(Number) as [number, number, number];
    const probe = new Date(Date.UTC(y, m - 1, d));
    return probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
  }, 'That date does not exist.');

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, 'A lead needs a name.').max(120, 'Keep the name under 120 characters.'),
  company: trimmedOptional,
  // Optional, but checked when given: a typed address that is silently
  // accepted is worse than one refused at the form.
  email: z
    .string()
    .trim()
    .email('That does not look like an email address.')
    .max(200)
    .transform((value) => value.toLowerCase())
    .nullable()
    .or(z.literal('').transform(() => null)),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((value) => value === '' || /[0-9]{6,}/.test(value.replace(/\D/g, '')), {
      message: 'A phone number needs at least six digits.',
    })
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  source: z.enum(SOURCES),
  service: trimmedOptional,
  valueCents: z
    .number()
    .int('Amounts are held in whole cents.')
    .min(0, 'A deal cannot be worth less than nothing.')
    .max(1_000_000_000_00, 'That is larger than this tool is meant to hold.'),
  stage: z.enum(STAGES),
  notes: z.string().trim().max(5000, 'Keep notes under 5000 characters.').transform((value) => (value === '' ? null : value)).nullable(),
  lastContactAt: civilDate.nullable().or(z.literal('').transform(() => null)),
});

export const activityInputSchema = z.object({
  leadId: z.string().min(1),
  kind: z.enum(['note', 'contact', 'stage-change', 'follow-up']),
  body: z.string().trim().min(1, 'An activity needs a description.').max(2000),
  occurredOn: civilDate,
});

export type LeadInputParsed = z.infer<typeof leadInputSchema>;

/** The schema must keep producing exactly the domain's input shape. */
const _shapeCheck: LeadInput = {} as LeadInputParsed;
void _shapeCheck;

/**
 * Reads an amount typed by a person into integer cents.
 *
 * Both "1.234,56" and "1,234.56" occur in the wild; whichever separator
 * comes last is the decimal mark.
 */
export function parseAmountToCents(raw: string): { ok: true; cents: number } | { ok: false; message: string } {
  const cleaned = raw.replace(/[R$\s US€£]/g, '').trim();
  if (cleaned === '') return { ok: true, cents: 0 };

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const normalised =
    lastComma > lastDot
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');

  if (!/^\d*\.?\d*$/.test(normalised) || normalised === '') {
    return { ok: false, message: `"${raw}" is not an amount.` };
  }
  const value = Number(normalised);
  if (!Number.isFinite(value)) return { ok: false, message: `"${raw}" is not an amount.` };
  return { ok: true, cents: Math.round(value * 100) };
}
