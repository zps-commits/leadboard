import { SOURCE_LABELS, STAGE_LABELS, type Lead } from '@/lib/domain/lead';

/**
 * Exporting leads to a file a spreadsheet opens without surprises.
 *
 * Money leaves as a plain decimal rather than a formatted string:
 * "R$ 4.500,00" read back is text, and whoever imports it would have
 * to undo the formatting to get the number back.
 */

const FORMULA_START = /^[=+\-@\t\r]/;

/** A cell beginning = + - @ is a formula to Excel and to Sheets. */
export function escapeCell(value: string): string {
  const guarded = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

const row = (cells: (string | number)[]): string =>
  cells.map((cell) => escapeCell(String(cell))).join(',');

export const LEAD_COLUMNS = [
  'name',
  'company',
  'email',
  'phone',
  'source',
  'service',
  'value',
  'stage',
  'last_contact',
  'notes',
  'created_at',
] as const;

export function leadsToCsv(leads: Lead[]): string {
  return [
    row([...LEAD_COLUMNS]),
    ...leads.map((lead) =>
      row([
        lead.name,
        lead.company ?? '',
        lead.email ?? '',
        lead.phone ?? '',
        SOURCE_LABELS[lead.source],
        lead.service ?? '',
        (lead.valueCents / 100).toFixed(2),
        STAGE_LABELS[lead.stage],
        lead.lastContactAt ?? '',
        // Newlines inside a note are kept; the quoting handles them.
        lead.notes ?? '',
        lead.createdAt,
      ]),
    ),
  ].join('\n');
}

/** Excel only reads UTF-8 when the file says so. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
