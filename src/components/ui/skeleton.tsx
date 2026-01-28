import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pulse" | "wave";
}

function Skeleton({
  className,
  variant = "pulse",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === "wave" ? "skeleton-wave" : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
