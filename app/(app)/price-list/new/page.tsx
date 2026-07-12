import { requireOwner } from "@/lib/auth";
import { PageHeader } from "../../_components/page-header";
import { PriceItemForm } from "../_components/price-item-form";
import { createPriceItemAction } from "../actions";

export default async function NewPriceItemPage() {
  await requireOwner();
  return (
    <>
      <PageHeader title="New price item" />
      <PriceItemForm action={createPriceItemAction} submitLabel="Add item" />
    </>
  );
}
