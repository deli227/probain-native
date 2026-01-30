import { BookOpen, Users, Briefcase, FileText, Award, Clock } from "lucide-react";

interface StatItem {
  label: string;
  value: number | string;
  icon: "courses" | "students" | "jobs" | "applications" | "certifications" | "experience";
}

interface ProfileStatsProps {
  stats: StatItem[];
}

const iconMap = {
  courses: BookOpen,
  students: Users,
  jobs: Briefcase,
  applications: FileText,
  certifications: Award,
  experience: Clock,
};

// Couleurs subtiles pour chaque type
const accentColors = {
  courses: "from-blue-500/20 to-blue-600/10",
  students: "from-purple-500/20 to-purple-600/10",
  jobs: "from-amber-500/20 to-amber-600/10",
  applications: "from-cyan-500/20 to-cyan-600/10",
  certifications: "from-blue-500/20 to-indigo-600/10",
  experience: "from-emerald-500/20 to-emerald-600/10",
};

const iconBgColors = {
  courses: "bg-blue-500/30",
  students: "bg-purple-500/30",
  jobs: "bg-amber-500/30",
  applications: "bg-cyan-500/30",
  certifications: "bg-blue-500/30",
  experience: "bg-emerald-500/30",
};

export const ProfileStats = ({ stats }: ProfileStatsProps) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="flex flex-nowrap justify-center gap-3 md:flex-col md:gap-4 py-4 overflow-x-auto md:overflow-visible">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.icon];
        const gradientColor = accentColors[stat.icon];
        const iconBg = iconBgColors[stat.icon];
        return (
          <div
            key={index}
            className={`group relative flex items-center gap-3 md:gap-4 bg-gradient-to-br ${gradientColor} backdrop-blur-md px-4 md:px-5 py-3 md:py-4 rounded-2xl border border-white/20 shadow-lg shadow-black/10 transition-all duration-300 hover:shadow-xl hover:border-white/30 hover:-translate-y-1 flex-shrink-0 overflow-hidden`}
          >
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <div className={`relative p-2 md:p-2.5 ${iconBg} rounded-xl backdrop-blur-sm`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="relative text-white">
              <p className="text-xl md:text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-white/60 font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
