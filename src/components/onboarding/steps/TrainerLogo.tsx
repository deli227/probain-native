import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, ChevronLeft, Upload, Loader2 } from "lucide-react";
import { PhotoPickerSheet } from "@/components/shared/PhotoPickerSheet";
import { useToast } from "@/hooks/use-toast";

interface TrainerLogoProps {
  logoUrl: string;
  organizationName: string;
  uploading: boolean;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export const TrainerLogo = ({
  logoUrl,
  organizationName,
  uploading,
  onLogoUpload,
  onNext,
  onBack,
}: TrainerLogoProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { toast } = useToast();

  // Refs pour les inputs file — places a la racine du composant (hors du Portal Radix)
  // pour que l'onChange fonctionne sur Android WebView (Despia)
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onLogoUpload(e);
      setPickerOpen(false);
    } else {
      console.warn('[Upload] No file selected in TrainerLogo');
      toast({ title: "Erreur", description: "Aucune image sélectionnée", variant: "destructive" });
    }
    e.target.value = '';
  }, [onLogoUpload, toast]);

  return (
    <div className="flex-1 flex flex-col px-6 pt-4 animate-slide-up">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/60 hover:text-white transition-colors mb-8 self-start"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Retour</span>
      </button>

      {/* Icône */}
      <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 mx-auto mb-8">
        <ImagePlus className="w-10 h-10 text-white" />
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Ajoutez votre logo
        </h2>
        <p className="text-white/60">
          Rendez votre profil plus professionnel
        </p>
      </div>

      {/* Zone d'upload */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative group">
          {logoUrl ? (
            <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-40 h-40 bg-white/10 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white/30">
              <Upload className="w-10 h-10 text-white/50 mb-2" />
              <span className="text-white/50 text-sm text-center px-4">
                {organizationName?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}

          <div
            role="button"
            tabIndex={0}
            onClick={() => setPickerOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && setPickerOpen(true)}
            className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl
                     cursor-pointer transition-all duration-300
                     ${logoUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
          >
            <div className="text-center">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-white mx-auto mb-2 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-white mx-auto mb-2" />
              )}
              <span className="text-white text-sm">
                {uploading ? "Chargement..." : logoUrl ? "Changer" : "Choisir un logo"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-sm mt-4 text-center">
          Format recommandé : carré, minimum 200x200px
        </p>
      </div>

      {/* Boutons */}
      <div className="pb-8 pt-4 space-y-3">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl transition-all duration-300"
        >
          {logoUrl ? "CONTINUER" : "PASSER CETTE ÉTAPE"}
        </Button>
      </div>

      {/* PhotoPickerSheet - UI boutons camera/galerie */}
      <PhotoPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onFileSelected={onLogoUpload}
        uploading={uploading}
        title="Ajouter un logo"
        externalCameraRef={cameraRef}
        externalGalleryRef={galleryRef}
      />

      {/* Inputs file a la racine du composant (hors du Portal Radix)
          pour compatibilite Android WebView — meme pattern que RescuerPhoto */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
};
