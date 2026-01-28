import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-primary-dark pb-20">
      <div className="relative max-w-[1920px] mx-auto">
        {/* Header skeleton */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary to-primary-dark">
          {/* Settings button placeholder */}
          <div className="absolute top-3 right-3">
            <Skeleton variant="wave" className="w-10 h-10 rounded-full bg-white/20" />
          </div>

          {/* Profile photo skeleton - positioned at bottom center */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
            <Skeleton variant="wave" className="w-32 h-32 rounded-full border-4 border-primary-dark" />
          </div>
        </div>

        {/* Content with padding for avatar */}
        <div className="pt-20 px-4 md:px-6 lg:px-8">
          {/* Name and bio */}
          <div className="text-center space-y-3 mb-6">
            <Skeleton variant="wave" className="h-7 w-48 mx-auto bg-white/20" />
            <Skeleton variant="wave" className="h-4 w-32 mx-auto bg-white/10" />
            <div className="flex flex-col gap-2 items-center">
              <Skeleton variant="wave" className="h-4 w-64 bg-white/10" />
              <Skeleton variant="wave" className="h-4 w-56 bg-white/10" />
            </div>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 text-center">
                <Skeleton variant="wave" className="h-8 w-8 mx-auto mb-2 bg-white/20" />
                <Skeleton variant="wave" className="h-6 w-12 mx-auto mb-1 bg-white/20" />
                <Skeleton variant="wave" className="h-4 w-16 mx-auto bg-white/10" />
              </div>
            ))}
          </div>

          {/* Profile completion skeleton */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <Skeleton variant="wave" className="h-5 w-40 bg-white/20" />
              <Skeleton variant="wave" className="h-5 w-12 bg-white/20" />
            </div>
            <Skeleton variant="wave" className="h-2 w-full rounded-full bg-white/10" />
          </div>

          {/* Experience section skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="wave" className="h-6 w-32 bg-white/20" />
              <Skeleton variant="wave" className="h-8 w-8 rounded-full bg-white/20" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2].map((i) => (
                <div key={i} className="min-w-[280px] bg-white/10 rounded-xl p-4">
                  <Skeleton variant="wave" className="h-5 w-40 mb-2 bg-white/20" />
                  <Skeleton variant="wave" className="h-4 w-32 mb-2 bg-white/10" />
                  <Skeleton variant="wave" className="h-4 w-24 bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Formation section skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="wave" className="h-6 w-32 bg-white/20" />
              <Skeleton variant="wave" className="h-8 w-8 rounded-full bg-white/20" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2].map((i) => (
                <div key={i} className="min-w-[280px] bg-white/10 rounded-xl p-4">
                  <Skeleton variant="wave" className="h-5 w-40 mb-2 bg-white/20" />
                  <Skeleton variant="wave" className="h-4 w-32 mb-2 bg-white/10" />
                  <Skeleton variant="wave" className="h-4 w-24 bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Availability section skeleton */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="wave" className="h-6 w-36 bg-white/20" />
              <Skeleton variant="wave" className="h-8 w-16 rounded-full bg-white/20" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="wave"
                  className="h-10 w-full rounded-md bg-white/10"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
