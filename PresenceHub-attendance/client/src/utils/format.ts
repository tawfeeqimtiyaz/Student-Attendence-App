// ============================================
// Formatting helpers — dates, money, names
// ============================================

import { format } from 'date-fns';

/** Currency used across the app. Seed data and fee amounts are in INR. */
const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatCurrency(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0);
}

export function formatNumber(value: number | null | undefined): string {
  return numberFormatter.format(value ?? 0);
}

/**
 * Calendar dates (attendance day, due date, incident date) are stored as UTC
 * midnight. Parsing them with `new Date()` shifts the day in negative-offset
 * timezones, so read the YYYY-MM-DD part and build a local date instead.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(value: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!value) return '—';
  return format(parseDateOnly(value), pattern);
}

/** For real timestamps (createdAt etc.) where local time is correct. */
export function formatTimestamp(value: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!value) return '—';
  return format(new Date(value), pattern);
}

/** Today's date in the user's timezone as YYYY-MM-DD. */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fullName(person?: { firstName?: string; lastName?: string } | null): string {
  if (!person) return '—';
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || '—';
}

export function initials(person?: { firstName?: string; lastName?: string } | null): string {
  if (!person) return '?';
  return `${person.firstName?.[0] ?? ''}${person.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

/** "SOME_ENUM_VALUE" → "Some enum value" */
export function humanize(value: string | null | undefined): string {
  if (!value) return '—';
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Academic years are validated as YYYY-YYYY; seed data uses YYYY-YY. */
export function normalizeAcademicYear(value: string): string {
  const short = /^(\d{4})-(\d{2})$/.exec(value);
  if (short) return `${short[1]}-${short[1].slice(0, 2)}${short[2]}`;
  return value;
}

export function currentAcademicYear(now = new Date()): string {
  // Academic years start in June/July in most institutions using this system.
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}
