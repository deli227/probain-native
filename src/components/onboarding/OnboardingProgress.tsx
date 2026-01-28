interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  variant?: "dots" | "bar";
}

export const OnboardingProgress = ({
  currentStep,
  totalSteps,
  variant = "dots",
}: OnboardingProgressProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  if (variant === "bar") {
    return (
      <div className="w-full px-8 py-4">
        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-white/60 text-xs mt-2">
          {currentStep + 1} / {totalSteps}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className="relative"
          >
            {/* Ring animé pour le step actif */}
            {isActive && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-white/50 animate-pulse-ring" />
            )}

            {/* Dot principal */}
            <div
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${isActive
                  ? "bg-white scale-125 shadow-lg shadow-white/30"
                  : isCompleted
                    ? "bg-white/80"
                    : "bg-white/30"
                }
              `}
            />

            {/* Ligne de connexion */}
            {index < totalSteps - 1 && (
              <div
                className={`
                  absolute top-1/2 left-full w-3 h-0.5 -translate-y-1/2
                  transition-all duration-300
                  ${isCompleted ? "bg-white/60" : "bg-white/20"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
