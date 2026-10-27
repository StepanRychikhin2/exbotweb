import { UserInputError } from './errors.js';

export function todayInZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// A PostgreSQL DATE is a calendar date, represented at UTC midnight at the adapter boundary.
export function dateValue(day: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new UserInputError('Неправильна дата.');
  const result = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(result.getTime()) || result.toISOString().slice(0, 10) !== day) {
    throw new UserInputError('Неправильна дата.');
  }
  return result;
}

export function monthRange(month: string): { from: Date; to: Date } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 9998) {
    throw new UserInputError('Вкажіть місяць у форматі /export YYYY-MM, наприклад /export 2026-10 (рік 1900–9998).');
  }
  const from = dateValue(`${month}-01`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);
  return { from, to };
}

export function displayDate(date: Date | string): string {
  const iso = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}
