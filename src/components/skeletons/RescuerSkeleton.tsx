import { Skeleton } from "@/components/ui/skeleton";

interface RescuerSkeletonProps {
  count?: number;
}

export const RescuerSkeleton = ({ count = 10 }: RescuerSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 stagger-children px-4 py-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col items-center justify-center gap-2">
          {/* Avatar circle */}
          <Skeleton variant="wave" className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full" />
          {/* Name */}
          <Skeleton variant="wave" className="h-4 w-20" />
          {/* City */}
          <Skeleton variant="wave" className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
};
