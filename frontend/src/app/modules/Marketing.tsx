import { PageHeader } from "../components/PageHeader";

export function Marketing() {
  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Marketing"
        description="Track campaigns and marketing performance"
        action={{
          label: "New Campaign",
          onClick: () => {}
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8" />
    </div>
  );
}