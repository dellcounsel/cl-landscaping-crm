import { requireOwner } from "@/lib/auth";
import { PageHeader } from "../../_components/page-header";
import { ClientForm } from "../_components/client-form";
import { createClientAction } from "../actions";

export default async function NewClientPage() {
  await requireOwner();
  return (
    <>
      <PageHeader title="New client" />
      <ClientForm action={createClientAction} submitLabel="Create client" />
    </>
  );
}
