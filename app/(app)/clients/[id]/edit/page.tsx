import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/page-header";
import { ClientForm } from "../../_components/client-form";
import { updateClientAction } from "../../actions";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwner();

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  // Bind the client id so the form's action matches (prev, formData).
  const action = updateClientAction.bind(null, id);

  return (
    <>
      <PageHeader title="Edit client" />
      <ClientForm
        action={action}
        client={client}
        submitLabel="Save changes"
      />
    </>
  );
}
