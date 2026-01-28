import { Check, X, AlertCircle } from "lucide-react";

interface CompletionItem {
  label: string;
  completed: boolean;
}

interface ProfileCompletionProps {
  items: CompletionItem[];
  className?: string;
}

export const ProfileCompletion = ({ items, className = "" }: ProfileCompletionProps) => {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // Couleur selon le pourcentage
  const getProgressColor = () => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getTextColor = () => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  // Si profil complet, ne pas afficher
  if (percentage === 100) return null;

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-5 h-5 ${getTextColor()}`} />
          <span className="text-white font-medium text-sm md:text-base">
            Complétez votre profil
          </span>
        </div>
        <span className={`font-bold text-lg ${getTextColor()}`}>{percentage}%</span>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Liste des éléments */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-sm ${
              item.completed ? "text-white/60" : "text-white"
            }`}
          >
            {item.completed ? (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-orange-400 flex-shrink-0" />
            )}
            <span className={item.completed ? "line-through" : ""}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
