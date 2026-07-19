import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDateShort, todayISO } from "@/lib/dates";
import { jobStatusClasses, jobStatusLabel, formatTime } from "@/lib/jobs";
import { PageHeader } from "../_components/page-header";

const WINDOW_DAYS = 7;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start: startParam } = await searchParams;
  const profile = await requireProfile();
  const today = todayISO();
  const start = startParam && /^\d{4}-\d{2}-\d{2}$/.test(startParam)
    ? startParam
    : today;
  const end = addDays(start, WINDOW_DAYS - 1);

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, scheduled_date, scheduled_time, status, clients(name)")
    .gte("scheduled_date", start)
    .lte("scheduled_date", end)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true, nullsFirst: false });

  // Bucket jobs by day across the window.
  const days: { date: string; jobs: NonNullable<typeof jobs> }[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const date = addDays(start, i);
    days.push({
      date,
      jobs: (jobs ?? []).filter((j) => j.scheduled_date === date),
    });
  }

  const prevStart = addDays(start, -WINDOW_DAYS);
  const nextStart = addDays(start, WINDOW_DAYS);

  return (
    <>
      <PageHeader
        title="Schedule"
        actionHref={profile.role === "owner" ? "/jobs/new" : undefined}
        actionLabel="New"
      />

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Link
          href={`/schedule?start=${prevStart}`}
          className="flex h-10 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium dark:border-neutral-700"
        >
          ‹ Prev
        </Link>
        <Link
          href="/schedule"
          className="text-sm font-medium text-green-700 dark:text-green-500"
        >
          This week
        </Link>
        <Link
          href={`/schedule?start=${nextStart}`}
          className="flex h-10 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium dark:border-neutral-700"
        >
          Next ›
        </Link>
      </div>

      <div className="flex flex-col gap-4 p-4 pt-0">
        {days.map((day) => (
          <section key={day.date}>
            <h2
              className={`mb-1.5 text-sm font-semibold ${
                day.date === today
                  ? "text-green-700 dark:text-green-500"
                  : "text-neutral-500"
              }`}
            >
              {formatDateShort(day.date)}
              {day.date === today ? " · Today" : ""}
            </h2>
            {day.jobs.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-800">
                No jobs
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                {day.jobs.map((j) => {
                  const client = j.clients as { name: string } | null;
                  const time = formatTime(j.scheduled_time);
                  return (
                    <li key={j.id}>
                      <Link
                        href={`/jobs/${j.id}`}
                        className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2.5 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                      >
                        <span className="w-16 shrink-0 text-xs text-neutral-500">
                          {time ?? "—"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {client?.name ?? "Client"}
                          </p>
                          <p className="truncate text-xs text-neutral-500">
                            {j.title}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${jobStatusClasses(j.status)}`}
                        >
                          {jobStatusLabel(j.status)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
