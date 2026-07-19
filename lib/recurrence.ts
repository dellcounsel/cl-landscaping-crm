import { createServiceClient } from "@/lib/supabase/service";
import { addDays, parseISODate, todayISO } from "@/lib/dates";
import type { RecurFreq, Recurrence } from "@/lib/database.types";

/** How far ahead occurrences are materialized. */
export const MATERIALIZE_HORIZON_WEEKS = 8;

type Rule = Pick<
  Recurrence,
  "freq" | "interval_count" | "anchor_date" | "until_date"
>;

function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** anchor + k steps, honoring freq. Monthly clamps day to the month's length. */
function stepFrom(anchorISO: string, freq: RecurFreq, interval: number, k: number): string {
  if (freq === "monthly") {
    const [y, m, d] = anchorISO.split("-").map(Number);
    const totalMonths = (m - 1) + interval * k;
    const year = y + Math.floor(totalMonths / 12);
    const month0 = ((totalMonths % 12) + 12) % 12;
    const day = Math.min(d, daysInMonth(year, month0));
    const mm = String(month0 + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }
  const perStep = freq === "weekly" ? interval * 7 : interval; // daily
  return addDays(anchorISO, perStep * k);
}

/**
 * Series slot dates (ISO "YYYY-MM-DD") in [fromISO, throughISO], aligned to the
 * anchor. ISO date strings compare lexicographically, so string comparison is
 * safe here.
 */
export function occurrenceDates(
  rule: Rule,
  fromISO: string,
  throughISO: string,
): string[] {
  const dates: string[] = [];
  const interval = Math.max(1, rule.interval_count);
  for (let k = 0; k < 5000; k++) {
    const d = stepFrom(rule.anchor_date, rule.freq, interval, k);
    if (d > throughISO) break;
    if (rule.until_date && d > rule.until_date) break;
    if (d >= fromISO) dates.push(d);
  }
  return dates;
}

/**
 * Materialize a single recurrence's occurrences from today through the horizon.
 * Idempotent via ON CONFLICT (recurrence_id, series_date) DO NOTHING, so the
 * daily cron and on-create call are both safe. Uses the service client.
 * Returns the number of new occurrences inserted.
 */
export async function materializeRecurrence(recurrenceId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data: rec } = await supabase
    .from("recurrences")
    .select("*")
    .eq("id", recurrenceId)
    .single();

  if (!rec || !rec.active) return 0;

  const today = todayISO();
  const horizon = addDays(today, MATERIALIZE_HORIZON_WEEKS * 7);
  const dates = occurrenceDates(rec, today, horizon);
  if (dates.length === 0) return 0;

  const rows = dates.map((date) => ({
    client_id: rec.client_id,
    recurrence_id: rec.id,
    title: rec.title,
    scheduled_date: date,
    series_date: date,
    scheduled_time: rec.scheduled_time,
    duration_minutes: rec.duration_minutes,
    assigned_to: rec.assigned_to,
    notes: rec.notes,
    status: "scheduled" as const,
  }));

  // Count existing slots so we can report how many are actually new.
  const { count: before } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("recurrence_id", rec.id);

  const { error } = await supabase
    .from("jobs")
    .upsert(rows, {
      onConflict: "recurrence_id,series_date",
      ignoreDuplicates: true,
    });
  if (error) throw error;

  const { count: after } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("recurrence_id", rec.id);

  return (after ?? 0) - (before ?? 0);
}

/** Materialize every active recurrence. Used by the daily cron. */
export async function materializeAllRecurrences(): Promise<{
  recurrences: number;
  created: number;
}> {
  const supabase = createServiceClient();
  const { data: recs } = await supabase
    .from("recurrences")
    .select("id")
    .eq("active", true);

  let created = 0;
  for (const r of recs ?? []) {
    created += await materializeRecurrence(r.id);
  }
  return { recurrences: recs?.length ?? 0, created };
}
