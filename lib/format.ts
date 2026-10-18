export type CurrencyCode = 'BRL' | 'USD';

const LOCALES: Record<CurrencyCode, string> = { BRL: 'pt-BR', USD: 'en-US' };

/** Cents to money. The only place an amount becomes a float. */
export function formatMoney(cents: number, currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(LOCALES[currency], { style: 'currency', currency }).format(
    cents / 100,
  );
}

export function formatMoneyShort(cents: number, currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(LOCALES[currency], {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export function formatCount(value: number, currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(LOCALES[currency]).format(value);
}

/** Hundredths of a percent to a readable rate. */
export function formatRate(basisPoints: number | null): string {
  return basisPoints === null ? 'nothing decided yet' : `${(basisPoints / 100).toFixed(0)}%`;
}

/** "2026-03-17" in words, in UTC, because it means a day. */
export function formatDay(day: string, currency: CurrencyCode = 'BRL'): string {
  return new Intl.DateTimeFormat(LOCALES[currency], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
}

/** How long ago, in plain words. Null dates say so rather than showing a dash. */
export function formatSince(day: string | null, today: string): string {
  if (!day) return 'never contacted';
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000,
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** The current civil date, in UTC so it matches how dates are stored. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
