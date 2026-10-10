import { Skeleton } from "./components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto p-6 md:p-8 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl w-full" />
    </div>
  );
}
