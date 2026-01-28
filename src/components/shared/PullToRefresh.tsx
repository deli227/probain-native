import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, pullProgress, handlers } =
    usePullToRefresh({
      onRefresh,
      threshold: 80,
      disabled,
    });

  return (
    <div
      className={cn('relative', className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none z-10',
          (isPulling || isRefreshing) && pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: -40,
          transform: `translateY(${Math.min(pullDistance, 100)}px)`,
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100',
            isRefreshing && 'animate-pulse'
          )}
        >
          <Loader2
            className={cn(
              'w-5 h-5 text-primary transition-transform duration-200',
              isRefreshing && 'animate-spin'
            )}
            style={{
              transform: isRefreshing
                ? 'rotate(0deg)'
                : `rotate(${pullProgress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: isPulling || isRefreshing
            ? `translateY(${Math.min(pullDistance * 0.3, 30)}px)`
            : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
