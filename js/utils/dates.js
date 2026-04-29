import { normalizeText } from './formatters.js';

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number') {
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(excelDate.getTime()) ? null : excelDate;
  }

  const text = String(value).trim();
  const nativeDate = new Date(text);
  if (!Number.isNaN(nativeDate.getTime())) return nativeDate;

  const localMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (localMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = localMatch;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function toDateTimeLocalValue(value) {
  const date = parseDate(value);
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return normalizeText(value) || '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function formatTime(value) {
  const date = parseDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function isSameDay(dateA, dateB) {
  return !!dateA && !!dateB &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();
}

export function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

export function getDateRangeForLastDays(days = 7) {
  const end = getToday();
  end.setHours(23, 59, 59, 999);
  const start = getToday();
  start.setDate(start.getDate() - (Math.max(days, 1) - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function isDateWithinRange(date, start, end) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}
