import type { JobStatus, RecurFreq } from "@/lib/database.types";

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
  invoiced: "Invoiced",
};

export function jobStatusLabel(status: JobStatus): string {
  return JOB_STATUS_LABELS[status];
}

export function jobStatusClasses(status: JobStatus): string {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "in_progress":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "invoiced":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";
    case "skipped":
      return "bg-neutral-200 text-neutral-500 line-through dark:bg-neutral-800";
    case "scheduled":
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  }
}

/** Human recurrence summary, e.g. "Every 2 weeks", "Weekly", "Monthly". */
export function recurrenceSummary(freq: RecurFreq, interval: number): string {
  const n = Math.max(1, interval);
  if (freq === "weekly") {
    if (n === 1) return "Weekly";
    return `Every ${n} weeks`;
  }
  if (freq === "monthly") {
    return n === 1 ? "Monthly" : `Every ${n} months`;
  }
  // daily
  return n === 1 ? "Daily" : `Every ${n} days`;
}

/** Format a "HH:MM[:SS]" time string to "9:00 AM". Returns null for null. */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}`;
}
