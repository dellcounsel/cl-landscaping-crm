import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../../_components/page-header";
import { QuoteForm } from "../../../../quotes/_components/quote-form";
import { createQuoteAction } from "../../../../quotes/actions";

export default async function NewQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();

  const supabase = await createClient();
  const [{ data: client }, { data: priceItems }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", id).single(),
    supabase
      .from("price_items")
      .select("id, name, unit, default_rate_cents")
      .eq("active", true)
      .order("name"),
  ]);

  if (!client) notFound();

  const action = createQuoteAction.bind(null, id);

  return (
    <>
      <PageHeader title="New quote" subtitle={client.name} />
      <QuoteForm
        action={action}
        priceItems={priceItems ?? []}
        cancelHref={`/clients/${id}`}
        submitLabel="Save draft"
      />
    </>
  );
}
