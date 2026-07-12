import { requireOwner } from "@/lib/auth";
import { PageHeader } from "../_components/page-header";
import { EmptyState, ComingSoon } from "../_components/empty-state";

export default async function InvoicesPage() {
  // Financial data — owner only. Crew is redirected to /today.
  await requireOwner();

  return (
    <>
      <PageHeader title="Invoices" />
      <EmptyState
        title="No invoices yet"
        description="Create invoices from completed jobs once invoicing is live."
      >
        <ComingSoon milestone="M5" />
      </EmptyState>
    </>
  );
}
