"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import type { ClientStatus } from "@/lib/database.types";

export type ClientFormState = { error: string | null };

function parseForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const billing_address = String(formData.get("billing_address") ?? "").trim();
  const property_address = String(
    formData.get("property_address") ?? "",
  ).trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = (String(formData.get("status") ?? "active") === "inactive"
    ? "inactive"
    : "active") as ClientStatus;

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    name,
    email: email || null,
    phone: phone || null,
    billing_address: billing_address || null,
    property_address: property_address || null,
    notes: notes || null,
    status,
    tags,
  };
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireOwner();
  const values = parseForm(formData);
  if (!values.name) return { error: "Name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not save the client. Please try again." };
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientAction(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireOwner();
  const values = parseForm(formData);
  if (!values.name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(values)
    .eq("id", id);

  if (error) {
    return { error: "Could not save changes. Please try again." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    // Surface via redirect param; the list still renders.
    redirect(`/clients?error=delete`);
  }
  revalidatePath("/clients");
  redirect("/clients");
}
