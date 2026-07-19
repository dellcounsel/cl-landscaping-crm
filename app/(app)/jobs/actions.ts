"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner, requireProfile } from "@/lib/auth";
import { materializeRecurrence } from "@/lib/recurrence";
import type { JobStatus, RecurFreq } from "@/lib/database.types";

export type JobFormState = { error: string | null };

function revalidateSchedule() {
  revalidatePath("/today");
  revalidatePath("/schedule");
}

// ---------------------------------------------------------------------------
// One-off jobs
// ---------------------------------------------------------------------------
function parseJobForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const client_id = String(formData.get("client_id") ?? "").trim();
  const scheduled_date = String(formData.get("scheduled_date") ?? "").trim();
  const scheduled_time = String(formData.get("scheduled_time") ?? "").trim() || null;
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const duration_minutes = durationRaw ? Math.max(1, parseInt(durationRaw, 10)) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const assigned_to = formData.getAll("assigned_to").map(String).filter(Boolean);
  return {
    title,
    client_id,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    notes,
    assigned_to,
  };
}

/** One create form handles both: branch on the "repeats" toggle. */
export async function createScheduleItemAction(
  prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  return formData.get("repeats") === "on"
    ? createRecurrenceAction(prev, formData)
    : createJobAction(prev, formData);
}

export async function createJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireOwner();
  const values = parseJobForm(formData);
  if (!values.client_id) return { error: "Choose a client." };
  if (!values.title) return { error: "Add a title." };
  if (!values.scheduled_date) return { error: "Pick a date." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...values, status: "scheduled" })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not save the job." };

  revalidateSchedule();
  revalidatePath(`/clients/${values.client_id}`);
  redirect(`/jobs/${data.id}`);
}

export async function updateJobAction(
  id: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireOwner();
  const values = parseJobForm(formData);
  if (!values.title) return { error: "Add a title." };
  if (!values.scheduled_date) return { error: "Pick a date." };

  const supabase = await createClient();
  // Editing a single occurrence marks it an exception so series-wide edits skip it.
  const { data: existing } = await supabase
    .from("jobs")
    .select("recurrence_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("jobs")
    .update({
      title: values.title,
      scheduled_date: values.scheduled_date,
      scheduled_time: values.scheduled_time,
      duration_minutes: values.duration_minutes,
      notes: values.notes,
      assigned_to: values.assigned_to,
      is_exception: existing?.recurrence_id ? true : false,
    })
    .eq("id", id);
  if (error) return { error: "Could not save changes." };

  revalidateSchedule();
  revalidatePath(`/jobs/${id}`);
  redirect(`/jobs/${id}`);
}

export async function deleteJobAction(id: string, clientId?: string) {
  await requireOwner();
  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", id);
  revalidateSchedule();
  if (clientId) revalidatePath(`/clients/${clientId}`);
  redirect("/schedule");
}

// ---------------------------------------------------------------------------
// Job status (crew-allowed: done / in_progress / scheduled)
// ---------------------------------------------------------------------------
export async function markJobDone(id: string, note?: string) {
  await requireProfile();
  const supabase = await createClient();
  const patch: { status: JobStatus; completed_at: string; notes?: string } = {
    status: "done",
    completed_at: new Date().toISOString(),
  };
  const trimmed = note?.trim();
  if (trimmed) {
    const { data: job } = await supabase
      .from("jobs")
      .select("notes")
      .eq("id", id)
      .single();
    patch.notes = job?.notes ? `${job.notes}\n${trimmed}` : trimmed;
  }
  await supabase.from("jobs").update(patch).eq("id", id);
  revalidateSchedule();
  revalidatePath(`/jobs/${id}`);
}

export async function setJobStatus(
  id: string,
  status: "scheduled" | "in_progress",
) {
  await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("jobs")
    .update({ status, completed_at: null })
    .eq("id", id);
  revalidateSchedule();
  revalidatePath(`/jobs/${id}`);
}

// Owner-only scheduling operations
export async function skipJob(id: string) {
  await requireOwner();
  const supabase = await createClient();
  await supabase.from("jobs").update({ status: "skipped" }).eq("id", id);
  revalidateSchedule();
  revalidatePath(`/jobs/${id}`);
}

export async function rescheduleJob(id: string, date: string) {
  await requireOwner();
  if (!date) return;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("jobs")
    .select("recurrence_id")
    .eq("id", id)
    .single();
  await supabase
    .from("jobs")
    .update({
      scheduled_date: date,
      is_exception: existing?.recurrence_id ? true : false,
    })
    .eq("id", id);
  revalidateSchedule();
  revalidatePath(`/jobs/${id}`);
}

// ---------------------------------------------------------------------------
// Recurring series
// ---------------------------------------------------------------------------
const FREQS: RecurFreq[] = ["daily", "weekly", "monthly"];

function parseRecurrenceForm(formData: FormData) {
  const base = parseJobForm(formData);
  const freqRaw = String(formData.get("freq") ?? "weekly");
  const freq: RecurFreq = FREQS.includes(freqRaw as RecurFreq)
    ? (freqRaw as RecurFreq)
    : "weekly";
  const interval_count = Math.max(
    1,
    parseInt(String(formData.get("interval_count") ?? "1"), 10) || 1,
  );
  const until_date = String(formData.get("until_date") ?? "").trim() || null;
  return {
    client_id: base.client_id,
    title: base.title,
    scheduled_time: base.scheduled_time,
    duration_minutes: base.duration_minutes,
    assigned_to: base.assigned_to,
    notes: base.notes,
    anchor_date: base.scheduled_date, // the form's date field is the series start
    freq,
    interval_count,
    until_date,
  };
}

export async function createRecurrenceAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireOwner();
  const values = parseRecurrenceForm(formData);
  if (!values.client_id) return { error: "Choose a client." };
  if (!values.title) return { error: "Add a title." };
  if (!values.anchor_date) return { error: "Pick a start date." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurrences")
    .insert({ ...values, active: true })
    .select("id, client_id")
    .single();
  if (error || !data) return { error: "Could not create the recurring job." };

  // Materialize the first 8 weeks immediately.
  await materializeRecurrence(data.id);

  revalidateSchedule();
  revalidatePath(`/clients/${data.client_id}`);
  redirect(`/clients/${data.client_id}`);
}

/** Edit the series and all future untouched occurrences ("this and future"). */
export async function updateRecurrenceAction(
  id: string,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  await requireOwner();
  const values = parseRecurrenceForm(formData);
  if (!values.title) return { error: "Add a title." };
  if (!values.anchor_date) return { error: "Pick a start date." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurrences")
    .update({
      title: values.title,
      freq: values.freq,
      interval_count: values.interval_count,
      scheduled_time: values.scheduled_time,
      duration_minutes: values.duration_minutes,
      assigned_to: values.assigned_to,
      notes: values.notes,
      anchor_date: values.anchor_date,
      until_date: values.until_date,
    })
    .eq("id", id);
  if (error) return { error: "Could not save changes." };

  const { createServiceClient } = await import("@/lib/supabase/service");
  const svc = createServiceClient();
  const { todayISO } = await import("@/lib/dates");
  // Remove future untouched occurrences (keep done/skipped/invoiced/exceptions),
  // then re-materialize from the updated template.
  await svc
    .from("jobs")
    .delete()
    .eq("recurrence_id", id)
    .eq("status", "scheduled")
    .eq("is_exception", false)
    .gte("series_date", todayISO());
  await materializeRecurrence(id);

  revalidateSchedule();
  redirect(`/clients/${values.client_id}`);
}

/** End a series: deactivate it and drop future untouched occurrences. */
export async function endRecurrenceAction(id: string, clientId: string) {
  await requireOwner();
  const supabase = await createClient();
  const { todayISO, addDays } = await import("@/lib/dates");
  await supabase
    .from("recurrences")
    .update({ active: false, until_date: addDays(todayISO(), -1) })
    .eq("id", id);
  await supabase
    .from("jobs")
    .delete()
    .eq("recurrence_id", id)
    .eq("status", "scheduled")
    .eq("is_exception", false)
    .gte("series_date", todayISO());
  revalidateSchedule();
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

// ---------------------------------------------------------------------------
// Convert an approved quote into a one-off job
// ---------------------------------------------------------------------------
export async function convertQuoteToJob(quoteId: string) {
  await requireOwner();
  const supabase = await createClient();
  const { todayISO } = await import("@/lib/dates");

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, client_id, status, clients(name)")
    .eq("id", quoteId)
    .single();
  if (!quote) redirect("/clients");

  const client = quote.clients as { name: string } | null;
  const { data: job } = await supabase
    .from("jobs")
    .insert({
      client_id: quote.client_id,
      quote_id: quote.id,
      title: `Work for ${client?.name ?? "client"}`,
      scheduled_date: todayISO(),
      status: "scheduled",
    })
    .select("id")
    .single();

  revalidateSchedule();
  if (job) redirect(`/jobs/${job.id}`);
  redirect("/schedule");
}
