import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { PageHeader } from "../../_components/page-header";
import { JobForm } from "../_components/job-form";
import { createScheduleItemAction } from "../actions";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientId } = await searchParams;
  await requireOwner();

  const supabase = await createClient();
  const [{ data: clients }, { data: assignees }, fixed] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    clientId
      ? supabase.from("clients").select("id, name").eq("id", clientId).single()
      : Promise.resolve({ data: null }),
  ]);

  const fixedClient = fixed?.data ?? undefined;

  return (
    <>
      <PageHeader title="New job" subtitle={fixedClient?.name} />
      <JobForm
        action={createScheduleItemAction}
        assignees={assignees ?? []}
        clients={clients ?? []}
        fixedClient={fixedClient}
        initial={{ date: todayISO() }}
        showRepeatToggle
        submitLabel="Create job"
        cancelHref={fixedClient ? `/clients/${fixedClient.id}` : "/schedule"}
      />
    </>
  );
}
