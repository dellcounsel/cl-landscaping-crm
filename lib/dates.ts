/**
 * All business logic runs in America/New_York per the FieldBook spec.
 * Timestamps are stored in UTC; calendar dates (scheduled_date, due_date) are
 * stored as plain `date` strings ("YYYY-MM-DD") interpreted in this zone.
 */

export const APP_TIMEZONE = "America/New_York";

/** "YYYY-MM-DD" for the current day in America/New_York. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Convert a Date (or now) to a "YYYY-MM-DD" string in the app timezone. */
export function toISODate(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Human-friendly date, e.g. "Sat, Jul 11". */
export function formatDateShort(iso: string): string {
  const d = parseISODate(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Human-friendly date with year, e.g. "July 11, 2026". */
export function formatDateLong(iso: string): string {
  const d = parseISODate(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Format a stored timestamp as a date+time in the app timezone. */
export function formatDateTime(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/**
 * Parse "YYYY-MM-DD" to a Date at noon UTC. Using noon avoids the date
 * shifting across the day boundary when rendered in an eastern-US timezone.
 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Add days to a "YYYY-MM-DD" string, returning a new "YYYY-MM-DD". */
export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODateFromUTCNoon(d);
}

function toISODateFromUTCNoon(d: Date): string {
  return d.toISOString().slice(0, 10);
}
