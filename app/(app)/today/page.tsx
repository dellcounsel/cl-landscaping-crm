import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateLong, todayISO } from "@/lib/dates";
import { PageHeader } from "../_components/page-header";
import { EmptyState } from "../_components/empty-state";
import { TodayCard } from "./_components/today-card";

export default async function TodayPage() {
  const profile = await requireProfile();
  const today = todayISO();

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, title, scheduled_time, notes, status, clients(name, property_address, billing_address)",
    )
    .eq("scheduled_date", today)
    .neq("status", "skipped")
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  const remaining = (jobs ?? []).filter((j) => j.status !== "done").length;

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={formatDateLong(today)}
        actionHref={profile.role === "owner" ? "/jobs/new" : undefined}
        actionLabel="New"
      />

      {!jobs || jobs.length === 0 ? (
        <EmptyState
          title="Nothing scheduled today"
          description={
            profile.role === "owner"
              ? "Add a job, or it'll fill in from recurring schedules."
              : "Enjoy the quiet — no jobs on the board today."
          }
        />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-neutral-500">
            {remaining > 0
              ? `${remaining} job${remaining === 1 ? "" : "s"} to go`
              : "All done for today 🎉"}
          </p>
          {jobs.map((j) => {
            const client = j.clients as {
              name: string;
              property_address: string | null;
              billing_address: string | null;
            } | null;
            return (
              <TodayCard
                key={j.id}
                job={{
                  id: j.id,
                  title: j.title,
                  scheduled_time: j.scheduled_time,
                  notes: j.notes,
                  status: j.status,
                  client_name: client?.name ?? "Client",
                  address:
                    client?.property_address || client?.billing_address || null,
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
