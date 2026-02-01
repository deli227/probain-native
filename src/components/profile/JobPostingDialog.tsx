
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Briefcase, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";
import DOMPurify from "dompurify";

// Couleur selon le type de contrat (meme pattern que JobPostingCard)
const getContractBadge = (type: string) => {
  switch (type) {
    case 'CDI': return 'bg-emerald-500/20 text-emerald-300';
    case 'CDD': return 'bg-blue-500/20 text-blue-300';
    case 'Stage': return 'bg-purple-500/20 text-purple-300';
    case 'Alternance': return 'bg-orange-500/20 text-orange-300';
    case 'Saisonnier': return 'bg-yellow-500/20 text-yellow-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};

interface JobPostingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  location: string;
  contractType: string;
  createdAt: string;
}

export const JobPostingDialog = ({
  isOpen,
  onClose,
  title,
  description,
  location,
  contractType,
  createdAt,
}: JobPostingDialogProps) => {
  const [isFullContentShown, setIsFullContentShown] = useState(false);

  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: fr,
  });

  // Sanitize HTML to prevent XSS attacks
  const sanitizedDescription = DOMPurify.sanitize(description);

  // Fonction pour gérer le partage de l'offre (pour mobile principalement)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Offre d'emploi: ${title}`,
          text: `${title} - ${location} - ${contractType}`,
          url: window.location.href,
        });
      } catch {
        // Le partage a été annulé ou a échoué
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogHeader className="relative pb-4 border-b border-white/10 mb-4">
          {/* Badge type de contrat */}
          <div className="mb-2">
            <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg ${getContractBadge(contractType)}`}>
              {contractType}
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold text-white pr-8">{title}</DialogTitle>

          <DialogDescription asChild>
            <div className="flex flex-col gap-1.5 mt-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                <Briefcase className="h-4 w-4 text-cyan-400" />
                <span>{contractType}</span>
              </div>
              <div className="flex items-center gap-2 text-xs italic text-white/40 mt-1">
                <Calendar className="h-3 w-3" />
                <span>Publie {formattedDate}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div
            className={`prose prose-sm sm:prose prose-invert max-w-none prose-p:text-white/80 prose-headings:text-white prose-strong:text-white prose-li:text-white/80 ${!isFullContentShown ? 'max-h-[300px] overflow-hidden relative' : ''}`}
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />

          {!isFullContentShown && description.length > 500 && (
            <div className="h-20 bg-gradient-to-b from-transparent to-[#0a1628] absolute bottom-0 left-0 right-0"></div>
          )}

          {description.length > 500 && (
            <Button
              variant="outline"
              onClick={() => setIsFullContentShown(!isFullContentShown)}
              className="mt-2 w-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            >
              {isFullContentShown ? "Afficher moins" : "Afficher plus"}
            </Button>
          )}

          <div className="mt-4 flex gap-2 justify-end">
            {navigator.share && (
              <Button onClick={handleShare} variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                Partager
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
