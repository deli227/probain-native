import { ReactNode } from "react";

interface OnboardingShellProps {
  children: ReactNode;
  variant?: "rescuer" | "establishment" | "trainer";
}

export const OnboardingShell = ({ children, variant = "rescuer" }: OnboardingShellProps) => {
  const getGradient = () => {
    switch (variant) {
      case "rescuer":
        return "from-[#0A1033] via-[#1E2761] to-[#408CFF]";
      case "establishment":
        return "from-[#0A1033] via-[#1E2761] to-[#2E4A8F]";
      case "trainer":
        return "from-[#0A1033] via-[#1E2761] to-[#6366F1]";
      default:
        return "from-[#0A1033] via-[#1E2761] to-[#408CFF]";
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getGradient()} relative overflow-hidden`}>
      {/* Vagues animées en fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Vague 1 - Plus lente */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-48 animate-wave-slow opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            className="text-white"
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Vague 2 - Moyenne */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-40 animate-wave-medium opacity-30"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            className="text-white"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,224C960,213,1056,171,1152,165.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Vague 3 - Plus rapide */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-32 animate-wave-fast opacity-40"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            className="text-white"
            d="M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,245.3C672,256,768,256,864,234.7C960,213,1056,171,1152,170.7C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Cercles décoratifs flottants */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" />
      <div className="absolute top-40 left-10 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float-delayed" />
      <div className="absolute bottom-40 right-20 w-40 h-40 bg-white/5 rounded-full blur-xl animate-float-slow" />

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
