import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/page-header";
import { PriceItemForm } from "../../_components/price-item-form";
import { updatePriceItemAction } from "../../actions";

export default async function EditPriceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("price_items")
    .select("*")
    .eq("id", id)
    .single();

  if (!item) notFound();

  const action = updatePriceItemAction.bind(null, id);

  return (
    <>
      <PageHeader title="Edit price item" />
      <PriceItemForm
        action={action}
        item={item}
        submitLabel="Save changes"
      />
    </>
  );
}
