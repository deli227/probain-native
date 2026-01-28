
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { X, MapPin, Briefcase, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";
import DOMPurify from "dompurify";

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
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-2 border-b mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold pr-8">{title}</DialogTitle>
          <DialogClose className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </DialogClose>
          
          <DialogDescription className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{contractType}</span>
            </div>
            <div className="flex items-center gap-2 text-xs italic text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>Publié {formattedDate}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div
            className={`prose prose-sm sm:prose max-w-none ${!isFullContentShown ? 'max-h-[300px] overflow-hidden relative' : ''}`}
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
          
          {!isFullContentShown && description.length > 500 && (
            <div className="h-20 bg-gradient-to-b from-transparent to-white absolute bottom-0 left-0 right-0"></div>
          )}
          
          {description.length > 500 && (
            <Button 
              variant="outline" 
              onClick={() => setIsFullContentShown(!isFullContentShown)}
              className="mt-2 w-full"
            >
              {isFullContentShown ? "Afficher moins" : "Afficher plus"}
            </Button>
          )}
          
          <div className="mt-4 flex gap-2 justify-end">
            {navigator.share && (
              <Button onClick={handleShare} variant="outline" size="sm">
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
