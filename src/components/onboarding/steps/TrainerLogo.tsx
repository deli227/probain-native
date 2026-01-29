import { Button } from "@/components/ui/button";
import { ImagePlus, ChevronLeft, Upload } from "lucide-react";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { PhotoPickerSheet } from "@/components/shared/PhotoPickerSheet";

interface TrainerLogoProps {
  logoUrl: string;
  organizationName: string;
  uploading: boolean;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  const { isPickerOpen, openPicker, setPickerOpen, desktopInputRef, handleFileSelected } = usePhotoPicker({
    onFileSelected: onLogoUpload,
  });

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
            onClick={openPicker}
            onKeyDown={(e) => e.key === 'Enter' && openPicker()}
            className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl
                     cursor-pointer transition-all duration-300
                     ${logoUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-white mx-auto mb-2" />
              <span className="text-white text-sm">
                {uploading ? "Chargement..." : "Choisir un logo"}
              </span>
            </div>
          </div>
          {/* Desktop fallback input */}
          <input
            ref={desktopInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            disabled={uploading}
            className="hidden"
          />
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

      <PhotoPickerSheet
        open={isPickerOpen}
        onOpenChange={setPickerOpen}
        onFileSelected={handleFileSelected}
        uploading={uploading}
        cameraFacing="environment"
        title="Logo de l'organisme"
      />
    </div>
  );
};
