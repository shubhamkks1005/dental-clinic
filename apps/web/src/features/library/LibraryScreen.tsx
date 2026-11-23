import { EmptyState } from "../../ui/page/EmptyState";
import { PageHeader } from "../../ui/page/Page";

// Placeholder page so the sidebar item works. The real Library (medicines, procedures, fees) is Q2.13.
export function LibraryScreen() {
  return (
    <>
      <PageHeader title="Library" subtitle="Your medicines, procedures and fees." />
      <EmptyState>The Library is being built. For now, edit these lists in Settings.</EmptyState>
    </>
  );
}
