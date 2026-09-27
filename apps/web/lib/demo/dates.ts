import type { DatePrecision } from './types';

const NL_MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];

interface Parts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

/** Parse the leading Y/M/D/H:M from an ISO-ish string without timezone math. */
export function parseParts(iso: string): Parts {
  const m = iso.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:[T ](\d{2}):(\d{2}))?/);
  return {
    year: m ? Number(m[1]) : 0,
    month: m && m[2] ? Number(m[2]) : 1,
    day: m && m[3] ? Number(m[3]) : 1,
    hour: m && m[4] ? Number(m[4]) : 0,
    minute: m && m[5] ? Number(m[5]) : 0,
  };
}

export function yearOf(iso: string): number {
  return parseParts(iso).year;
}
export function monthOf(iso: string): number {
  return parseParts(iso).month;
}

/**
 * A stable, sortable timestamp for an item. Uses the effective capture value.
 * Never returns the import time (§20) — the JSON already carries the resolved
 * capture date (user override > EXIF/taken > provider > source creation).
 */
export function effectiveSortTime(iso: string): number {
  const t = Date.parse(iso);
  if (!Number.isNaN(t)) return t;
  const p = parseParts(iso);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
}

/**
 * Render a date honouring its precision (§19, §63). A 1978 scan shows "1978",
 * never "1 januari 1978". No false precision is ever displayed.
 */
export function formatDemoDate(iso: string, precision: DatePrecision): string {
  const p = parseParts(iso);
  const month = NL_MONTHS[p.month - 1] ?? '';
  switch (precision) {
    case 'UNKNOWN':
      return 'Onbekende datum';
    case 'YEAR':
      return String(p.year);
    case 'APPROXIMATE':
      return `rond ${p.year}`;
    case 'MONTH':
      return `${month} ${p.year}`;
    case 'DATE':
      return `${p.day} ${month} ${p.year}`;
    case 'EXACT_TIME':
    default: {
      const hh = String(p.hour).padStart(2, '0');
      const mm = String(p.minute).padStart(2, '0');
      return `${p.day} ${month} ${p.year}, ${hh}:${mm}`;
    }
  }
}

export const NL_MONTH_NAMES = NL_MONTHS;
