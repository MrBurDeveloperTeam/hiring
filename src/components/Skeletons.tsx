interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function JobCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}
