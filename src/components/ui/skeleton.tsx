interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse rounded bg-[#e8e8e8] ${className}`} />
);

export const SkeletonCard = () => (
  <div className="flex-1 rounded-lg border border-[#e8e8e8] bg-white p-4">
    <Skeleton className="mb-2 h-3 w-16" />
    <Skeleton className="h-7 w-24" />
    <Skeleton className="mt-1.5 h-3 w-12" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-8 w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);
