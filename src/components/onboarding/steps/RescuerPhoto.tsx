import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ChevronLeft, Upload, Loader2 } from "lucide-react";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { PhotoPickerSheet } from "@/components/shared/PhotoPickerSheet";

interface RescuerPhotoProps {
  avatarUrl: string;
  firstName: string;
  lastName: string;
  uploading: boolean;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export const RescuerPhoto = ({
  avatarUrl,
  firstName,
  lastName,
  uploading,
  onAvatarUpload,
  onNext,
  onBack,
}: RescuerPhotoProps) => {
  const { isPickerOpen, openPicker, setPickerOpen, desktopInputRef, handleFileSelected } = usePhotoPicker({
    onFileSelected: onAvatarUpload,
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

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Ta photo de profil
        </h2>
        <p className="text-white/60">
          Une photo aide les établissements à te reconnaître
        </p>
      </div>

      {/* Avatar avec upload */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative group">
          {/* Avatar principal */}
          <Avatar className="w-40 h-40 border-4 border-white/30 shadow-2xl">
            <AvatarImage
              src={avatarUrl || "/placeholder.svg"}
              alt="Photo de profil"
              className="object-cover"
            />
            <AvatarFallback className="text-3xl bg-white/10 text-white">
              {firstName?.[0]}{lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          {/* Overlay upload */}
          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => e.key === 'Enter' && openPicker()}
            className={`
              absolute inset-0 flex flex-col items-center justify-center
              bg-black/50 rounded-full cursor-pointer
              transition-all duration-300
              ${avatarUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"}
            `}
          >
            {uploading ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <>
                <Camera className="w-10 h-10 text-white mb-2" />
                <span className="text-white text-sm font-medium">
                  {avatarUrl ? "Changer" : "Ajouter"}
                </span>
              </>
            )}
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

          {/* Ring animé - pointer-events-none pour ne pas bloquer les clics */}
          <div className="absolute -inset-2 border-2 border-white/20 rounded-full animate-pulse pointer-events-none" />
        </div>

        {/* Texte indicatif */}
        <p className="text-white/40 text-sm mt-6 text-center">
          {avatarUrl ? "Clique pour changer ta photo" : "Clique pour ajouter une photo"}
        </p>

        {/* Bouton skip */}
        {!avatarUrl && (
          <button
            onClick={onNext}
            className="text-white/50 text-sm mt-4 hover:text-white/70 transition-colors underline"
          >
            Passer cette étape
          </button>
        )}
      </div>

      {/* Bouton suivant */}
      <div className="pb-8 pt-4">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl transition-all duration-300"
        >
          {avatarUrl ? "CONTINUER" : "PASSER"}
        </Button>
      </div>

      <PhotoPickerSheet
        open={isPickerOpen}
        onOpenChange={setPickerOpen}
        onFileSelected={handleFileSelected}
        uploading={uploading}
        cameraFacing="user"
        title="Photo de profil"
      />
    </div>
  );
};
