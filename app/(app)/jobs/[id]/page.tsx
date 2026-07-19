import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateLong } from "@/lib/dates";
import {
  jobStatusClasses,
  jobStatusLabel,
  formatTime,
  recurrenceSummary,
  mapsUrl,
} from "@/lib/jobs";
import { PhoneIcon, MapPinIcon } from "../../_components/icons";
import { JobActions } from "./_components/job-actions";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const isOwner = profile.role === "owner";

  const supabase = await createClient();
  const [{ data: job }, { data: profiles }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "*, clients(id, name, phone, property_address, billing_address), recurrences(id, freq, interval_count)",
      )
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (!job) notFound();

  const client = job.clients as {
    id: string;
    name: string;
    phone: string | null;
    property_address: string | null;
    billing_address: string | null;
  } | null;
  const rec = job.recurrences as {
    id: string;
    freq: "daily" | "weekly" | "monthly";
    interval_count: number;
  } | null;
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const assignees = job.assigned_to
    .map((uid) => nameById.get(uid) || "Unknown")
    .filter(Boolean);
  const navAddress = client?.property_address || client?.billing_address;
  const time = formatTime(job.scheduled_time);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50/90 px-2 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <Link
          href="/schedule"
          className="flex h-11 items-center rounded-lg px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          ‹ Schedule
        </Link>
        {isOwner && (
          <Link
            href={`/jobs/${id}/edit`}
            className="flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950/30"
          >
            Edit
          </Link>
        )}
      </header>

      <div className="flex flex-col gap-5 p-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${jobStatusClasses(job.status)}`}
            >
              {jobStatusLabel(job.status)}
            </span>
            {rec && (
              <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {recurrenceSummary(rec.freq, rec.interval_count)}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-neutral-500">
            {formatDateLong(job.scheduled_date)}
            {time ? ` · ${time}` : ""}
            {job.duration_minutes ? ` · ${job.duration_minutes} min` : ""}
          </p>
          {client && (
            <Link
              href={`/clients/${client.id}`}
              className="text-sm font-medium text-green-700 dark:text-green-500"
            >
              {client.name}
            </Link>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            href={client?.phone ? `tel:${client.phone}` : undefined}
            icon={<PhoneIcon className="h-5 w-5" />}
            label="Call"
          />
          <QuickAction
            href={navAddress ? mapsUrl(navAddress) : undefined}
            external
            icon={<MapPinIcon className="h-5 w-5" />}
            label="Navigate"
          />
        </div>

        {navAddress && (
          <p className="text-sm text-neutral-500">{navAddress}</p>
        )}

        {assignees.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-neutral-500">Assigned:</span>
            {assignees.map((n, i) => (
              <span
                key={i}
                className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium dark:bg-neutral-800"
              >
                {n}
              </span>
            ))}
          </div>
        )}

        {job.notes && (
          <div>
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Notes
            </h2>
            <p className="whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              {job.notes}
            </p>
          </div>
        )}

        <JobActions
          id={job.id}
          clientId={client?.id ?? ""}
          status={job.status}
          isOwner={isOwner}
        />

        {isOwner && rec && (
          <Link
            href={`/jobs/series/${rec.id}/edit`}
            className="text-center text-sm font-medium text-neutral-500 underline"
          >
            Edit the whole series
          </Link>
        )}
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  label,
  external,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  const base =
    "flex h-14 items-center justify-center gap-2 rounded-xl border text-base font-semibold";
  if (!href) {
    return (
      <div
        className={`${base} cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700`}
      >
        {icon}
        {label}
      </div>
    );
  }
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${base} border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300`}
    >
      {icon}
      {label}
    </a>
  );
}
