
import { Button } from "@/components/ui/button";
import { Pencil, Trash, MapPin, Briefcase, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { memo } from "react";

interface JobPostingCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  contractType: string;
  createdAt: string;
  onOpenDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Couleur selon le type de contrat (meme pattern que ExperienceCard)
const getContractColor = (type: string) => {
  switch (type) {
    case 'CDI': return 'from-emerald-500 to-emerald-600';
    case 'CDD': return 'from-blue-500 to-blue-600';
    case 'Stage': return 'from-purple-500 to-purple-600';
    case 'Alternance': return 'from-orange-500 to-orange-600';
    case 'Saisonnier': return 'from-yellow-500 to-amber-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getContractBg = (type: string) => {
  switch (type) {
    case 'CDI': return 'bg-emerald-500/10 text-emerald-700 md:bg-emerald-500/20 md:text-emerald-300';
    case 'CDD': return 'bg-blue-500/10 text-blue-700 md:bg-blue-500/20 md:text-blue-300';
    case 'Stage': return 'bg-purple-500/10 text-purple-700 md:bg-purple-500/20 md:text-purple-300';
    case 'Alternance': return 'bg-orange-500/10 text-orange-700 md:bg-orange-500/20 md:text-orange-300';
    case 'Saisonnier': return 'bg-yellow-500/10 text-yellow-700 md:bg-yellow-500/20 md:text-yellow-300';
    default: return 'bg-gray-500/10 text-gray-700 md:bg-gray-500/20 md:text-gray-300';
  }
};

export const JobPostingCard = memo(function JobPostingCard({
  title,
  location,
  contractType,
  createdAt,
  onOpenDetails,
  onEdit,
  onDelete,
}: JobPostingCardProps) {
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="relative min-h-[200px] w-full sm:w-[320px] max-w-[95vw] sm:max-w-none">
      {/* Carte principale cliquable */}
      <div
        className="min-h-full w-full rounded-2xl bg-white md:bg-white/10 md:backdrop-blur-xl shadow-xl border border-gray-100 md:border-white/10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] flex overflow-hidden relative cursor-pointer"
        onClick={onOpenDetails}
      >
        {/* Boutons FIXES - position absolue par rapport a la CARTE */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-gray-100 md:bg-white/10 hover:bg-gray-200 md:hover:bg-white/20 transition-all duration-200 touch-manipulation"
            aria-label="Modifier l'annonce"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4 text-gray-600 md:text-white/70" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-red-50 md:bg-red-500/10 hover:bg-red-100 md:hover:bg-red-500/20 transition-all duration-200 touch-manipulation"
            aria-label="Supprimer l'annonce"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash className="h-4 w-4 text-red-500 md:text-red-400" />
          </Button>
        </div>

        {/* Barre laterale coloree - couleur selon type de contrat */}
        <div className={`w-2 rounded-l-2xl bg-gradient-to-b ${getContractColor(contractType)} flex-shrink-0`} />

        {/* Contenu */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Badge type de contrat - avec marge pour ne pas chevaucher les boutons */}
          <div className="mb-3 mr-24">
            <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg ${getContractBg(contractType)}`}>
              {contractType}
            </span>
          </div>

          {/* Titre */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-lg text-gray-900 md:text-white line-clamp-2 leading-snug mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-500 md:text-white/50 font-medium line-clamp-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {location}
            </p>
          </div>

          {/* Footer avec date */}
          <div className="pt-3 mt-auto border-t border-gray-100 md:border-white/10">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-gray-400 md:text-white/40" />
              <span className="text-xs text-gray-400 md:text-white/40 italic">
                Publié {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
