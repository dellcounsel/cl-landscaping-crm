import { PageHeader } from "../_components/page-header";
import { EmptyState, ComingSoon } from "../_components/empty-state";

export default function SchedulePage() {
  return (
    <>
      <PageHeader title="Schedule" />
      <EmptyState
        title="Nothing scheduled"
        description="The week's jobs will appear here once the scheduling engine is built."
      >
        <ComingSoon milestone="M3" />
      </EmptyState>
    </>
  );
}
