import { Skeleton } from "@/components/ui/skeleton";

interface ConversationSkeletonProps {
  count?: number;
}

export const ConversationSkeleton = ({ count = 5 }: ConversationSkeletonProps) => {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          {/* Avatar */}
          <Skeleton variant="wave" className="h-12 w-12 rounded-full shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="wave" className="h-4 w-28" />
              <Skeleton variant="wave" className="h-3 w-12" />
            </div>
            <Skeleton variant="wave" className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
