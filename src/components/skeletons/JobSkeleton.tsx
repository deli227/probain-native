import { Skeleton } from "@/components/ui/skeleton";

interface JobSkeletonProps {
  count?: number;
}

export const JobSkeleton = ({ count = 3 }: JobSkeletonProps) => {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <Skeleton variant="wave" className="h-7 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 stagger-children">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex flex-col gap-4"
          >
            {/* Title + badge */}
            <div className="flex items-start justify-between">
              <Skeleton variant="wave" className="h-6 w-3/4" />
              <Skeleton variant="wave" className="h-6 w-16 rounded-lg" />
            </div>

            {/* Description lines */}
            <div className="space-y-2">
              <Skeleton variant="wave" className="h-4 w-full" />
              <Skeleton variant="wave" className="h-4 w-full" />
              <Skeleton variant="wave" className="h-4 w-2/3" />
            </div>

            {/* Location + date */}
            <div className="flex items-center gap-4">
              <Skeleton variant="wave" className="h-4 w-24" />
              <Skeleton variant="wave" className="h-4 w-20" />
            </div>

            {/* Establishment */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <Skeleton variant="wave" className="h-8 w-8 rounded-full" />
              <Skeleton variant="wave" className="h-4 w-32" />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-auto">
              <Skeleton variant="wave" className="flex-1 h-10 rounded-xl" />
              <Skeleton variant="wave" className="flex-1 h-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
