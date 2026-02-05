import { Skeleton } from "@/components/ui/skeleton";

interface PostSkeletonProps {
  count?: number;
}

export const PostSkeleton = ({ count = 1 }: PostSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg"
        >
          {/* Header skeleton */}
          <div className="p-4 flex items-center gap-3 border-b border-white/10">
            <Skeleton variant="wave" className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="wave" className="h-4 w-32" />
              <Skeleton variant="wave" className="h-3 w-20" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <Skeleton variant="wave" className="h-5 w-3/4" />
            <Skeleton variant="wave" className="h-4 w-full" />
            <Skeleton variant="wave" className="h-4 w-full" />
            <Skeleton variant="wave" className="h-4 w-2/3" />
          </div>

          {/* Image skeleton (optional, show for some) */}
          {index % 2 === 0 && (
            <div className="px-4 pb-4">
              <Skeleton variant="wave" className="w-full h-48 rounded-lg" />
            </div>
          )}

          {/* Stats skeleton */}
          <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
            <Skeleton variant="wave" className="h-4 w-16" />
            <Skeleton variant="wave" className="h-4 w-24" />
          </div>

          {/* Actions skeleton */}
          <div className="px-4 py-3 border-t border-white/10 flex gap-2">
            <Skeleton variant="wave" className="flex-1 h-10 rounded-md" />
            <Skeleton variant="wave" className="flex-1 h-10 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
};
