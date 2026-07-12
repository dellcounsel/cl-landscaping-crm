"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { parseDollarsToCents } from "@/lib/money";
import type { PriceUnit } from "@/lib/database.types";

export type PriceItemFormState = { error: string | null };

const UNITS: PriceUnit[] = ["flat", "hour", "yard", "sqft"];

function parseForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "flat");
  const unit: PriceUnit = UNITS.includes(unitRaw as PriceUnit)
    ? (unitRaw as PriceUnit)
    : "flat";
  const default_rate_cents = Math.max(
    0,
    parseDollarsToCents(String(formData.get("default_rate") ?? "0")),
  );
  const active = formData.get("active") !== null;

  return { name, unit, default_rate_cents, active };
}

export async function createPriceItemAction(
  _prev: PriceItemFormState,
  formData: FormData,
): Promise<PriceItemFormState> {
  await requireOwner();
  const values = parseForm(formData);
  if (!values.name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("price_items").insert(values);
  if (error) return { error: "Could not save the item. Please try again." };

  revalidatePath("/price-list");
  redirect("/price-list");
}

export async function updatePriceItemAction(
  id: string,
  _prev: PriceItemFormState,
  formData: FormData,
): Promise<PriceItemFormState> {
  await requireOwner();
  const values = parseForm(formData);
  if (!values.name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("price_items")
    .update(values)
    .eq("id", id);
  if (error) return { error: "Could not save changes. Please try again." };

  revalidatePath("/price-list");
  redirect("/price-list");
}

export async function deletePriceItemAction(id: string) {
  await requireOwner();
  const supabase = await createClient();
  await supabase.from("price_items").delete().eq("id", id);
  revalidatePath("/price-list");
  redirect("/price-list");
}
