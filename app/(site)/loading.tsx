import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8" aria-busy aria-label="Chargement">
      <Skeleton className="h-12 w-full rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-36 sm:h-72" />)}
      </div>
    </div>
  );
}
