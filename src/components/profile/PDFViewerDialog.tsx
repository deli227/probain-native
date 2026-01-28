
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Download, ExternalLink, ZoomIn, ZoomOut, X, RotateCw, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PDFViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentTitle: string;
}

export const PDFViewerDialog = ({
  isOpen,
  onClose,
  documentUrl,
  documentTitle,
}: PDFViewerDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Sur mobile, ouvrir directement le PDF dans un nouvel onglet
  useEffect(() => {
    if (isOpen && isMobile && documentUrl) {
      // Ouvrir le PDF dans un nouvel onglet sur mobile
      window.open(documentUrl, '_blank');
      // Fermer le dialog
      onClose();
    }
  }, [isOpen, isMobile, documentUrl, onClose]);

  // Réinitialiser les états lors de la fermeture du dialogue
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true);
      setZoomLevel(100);
      setRotation(0);
      setLoadError(null);
    }
  }, [isOpen]);

  // Si mobile, ne pas afficher le dialog (le PDF s'ouvre dans un nouvel onglet)
  if (isMobile) {
    return null;
  }

  // Augmenter le niveau de zoom
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  // Diminuer le niveau de zoom
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  // Rotation du PDF
  const rotateDocument = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Gérer le téléchargement direct du document
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setLoadError("Erreur lors du téléchargement. Veuillez réessayer.");
    }
  };

  // Ouvrir le PDF dans un nouvel onglet
  const openInNewTab = () => {
    try {
      window.open(documentUrl, '_blank');
    } catch {
      setLoadError("Impossible d'ouvrir dans un nouvel onglet. Veuillez essayer de télécharger.");
    }
  };

  // Gérer les erreurs de chargement
  const handleIframeError = () => {
    setLoadError("Impossible de charger le document PDF. Essayez de le télécharger directement.");
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[98vw] p-0 overflow-hidden max-h-[95vh]">
        <DialogHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="font-bold text-md sm:text-lg truncate pr-2">
            {documentTitle}
          </DialogTitle>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="outline" size="icon" onClick={zoomOut} aria-label="Réduire">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={zoomIn} aria-label="Agrandir">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={rotateDocument} aria-label="Rotation">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload} aria-label="Télécharger">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={openInNewTab} aria-label="Ouvrir dans un nouvel onglet">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="relative w-full" style={{ height: "80vh" }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <div className="text-gray-600 mb-4">{loadError}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Télécharger
                </Button>
                <Button variant="outline" onClick={openInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto bg-gray-100">
              <iframe
                src={documentUrl}
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                onError={handleIframeError}
                title={documentTitle}
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoomLevel}%`,
                  height: `${10000 / zoomLevel}%`
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
