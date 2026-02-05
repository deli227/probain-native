import { Skeleton } from "@/components/ui/skeleton";

interface TrainingSkeletonProps {
  count?: number;
}

export const TrainingSkeleton = ({ count = 6 }: TrainingSkeletonProps) => {
  return (
    <div className="bg-primary/5 p-6 rounded-2xl">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col gap-3"
          >
            {/* Title + badge */}
            <div className="flex items-start justify-between">
              <Skeleton variant="wave" className="h-5 w-3/5" />
              <Skeleton variant="wave" className="h-5 w-14 rounded-full" />
            </div>

            {/* Category */}
            <Skeleton variant="wave" className="h-4 w-2/3" />

            {/* Location + date */}
            <div className="flex items-center gap-3">
              <Skeleton variant="wave" className="h-4 w-24" />
              <Skeleton variant="wave" className="h-4 w-20" />
            </div>

            {/* Places */}
            <Skeleton variant="wave" className="h-4 w-1/3" />

            {/* Button */}
            <Skeleton variant="wave" className="h-9 w-full rounded-lg mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};
