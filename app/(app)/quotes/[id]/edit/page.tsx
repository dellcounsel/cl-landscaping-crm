import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/page-header";
import { QuoteForm } from "../../_components/quote-form";
import { updateQuoteAction } from "../../actions";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();

  const supabase = await createClient();
  const [{ data: quote }, { data: priceItems }] = await Promise.all([
    supabase.from("quotes").select("*, clients(name)").eq("id", id).single(),
    supabase
      .from("price_items")
      .select("id, name, unit, default_rate_cents")
      .eq("active", true)
      .order("name"),
  ]);

  if (!quote) notFound();
  // Only drafts are editable; sent/approved quotes are locked.
  if (quote.status !== "draft") redirect(`/quotes/${id}`);

  const client = quote.clients as { name: string } | null;
  const action = updateQuoteAction.bind(null, id);

  return (
    <>
      <PageHeader title="Edit quote" subtitle={client?.name} />
      <QuoteForm
        action={action}
        priceItems={priceItems ?? []}
        quote={quote}
        cancelHref={`/quotes/${id}`}
        submitLabel="Save changes"
      />
    </>
  );
}
