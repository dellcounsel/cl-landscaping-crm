import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/page-header";
import { JobForm } from "../../_components/job-form";
import { updateJobAction } from "../../actions";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();

  const supabase = await createClient();
  const [{ data: job }, { data: assignees }] = await Promise.all([
    supabase.from("jobs").select("*, clients(id, name)").eq("id", id).single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  if (!job) notFound();

  const client = job.clients as { id: string; name: string } | null;
  const action = updateJobAction.bind(null, id);

  return (
    <>
      <PageHeader
        title="Edit job"
        subtitle={job.recurrence_id ? "This occurrence only" : undefined}
      />
      <JobForm
        action={action}
        assignees={assignees ?? []}
        fixedClient={client ?? undefined}
        initial={{
          title: job.title,
          date: job.scheduled_date,
          scheduled_time: job.scheduled_time,
          duration_minutes: job.duration_minutes,
          notes: job.notes,
          assigned_to: job.assigned_to,
        }}
        submitLabel="Save changes"
        cancelHref={`/jobs/${id}`}
      />
    </>
  );
}
