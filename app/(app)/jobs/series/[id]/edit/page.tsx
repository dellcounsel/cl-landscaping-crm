import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../../_components/page-header";
import { JobForm } from "../../../_components/job-form";
import { updateRecurrenceAction, endRecurrenceAction } from "../../../actions";
import { SubmitButton } from "../../../../_components/submit-button";

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();

  const supabase = await createClient();
  const [{ data: rec }, { data: assignees }] = await Promise.all([
    supabase
      .from("recurrences")
      .select("*, clients(id, name)")
      .eq("id", id)
      .single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  if (!rec) notFound();

  const client = rec.clients as { id: string; name: string } | null;
  const action = updateRecurrenceAction.bind(null, id);
  const endSeries = endRecurrenceAction.bind(null, id, client?.id ?? "");

  return (
    <>
      <PageHeader
        title="Edit series"
        subtitle="Applies to this and all future occurrences"
      />
      <JobForm
        action={action}
        assignees={assignees ?? []}
        fixedClient={client ?? undefined}
        initial={{
          title: rec.title,
          date: rec.anchor_date,
          scheduled_time: rec.scheduled_time,
          duration_minutes: rec.duration_minutes,
          notes: rec.notes,
          assigned_to: rec.assigned_to,
          freq: rec.freq,
          interval_count: rec.interval_count,
          until_date: rec.until_date,
        }}
        initialRepeats
        lockRepeat
        submitLabel="Save series"
        cancelHref={client ? `/clients/${client.id}` : "/schedule"}
      />

      <div className="px-4 pb-8">
        <form action={endSeries}>
          <SubmitButton
            pendingLabel="Ending…"
            className="h-11 w-full rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50"
          >
            End this series
          </SubmitButton>
        </form>
        <p className="mt-2 text-center text-xs text-neutral-500">
          Ends the series and removes upcoming unscheduled occurrences. Past and
          completed jobs are kept.
        </p>
      </div>
    </>
  );
}
