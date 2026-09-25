import { Skeleton } from "@/components/ui/misc";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <Skeleton className="mb-6 h-9 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="mt-6 h-72" />
    </div>
  );
}
