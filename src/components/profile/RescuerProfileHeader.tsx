
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Upload, Phone } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { PhotoPickerSheet } from "@/components/shared/PhotoPickerSheet";


interface RescuerProfileHeaderProps {
  firstName: string;
  lastName: string;
  age?: number;
  address?: {
    street: string;
    cityZip: string;
    canton: string;
  };
  biography?: string;
  avatarUrl?: string;
  certifications?: string[];
  onAvatarUpdate?: (url: string) => void;
  phone?: string;
  phoneVisible?: boolean;
  viewerIsEstablishment?: boolean;
  /** Bouton d'action affiché en haut à gauche sur desktop */
  actionButton?: React.ReactNode;
}

export const RescuerProfileHeader = ({
  firstName,
  lastName,
  age,
  address,
  biography,
  avatarUrl,
  certifications = [],
  onAvatarUpdate,
  phone,
  phoneVisible,
  viewerIsEstablishment,
  actionButton
}: RescuerProfileHeaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { toast } = useToast();

  // Refs pour les inputs file — places hors du Portal Radix pour Android WebView (Despia)
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image');
      }

      const file = event.target.files[0];
      
      // Validation taille fichier (5 MB max)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('L\'image ne doit pas dépasser 5 MB');
      }

      const fileExt = file.name.split('.').pop();
      
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      if (avatarUrl) {
        const oldFileName = avatarUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldFileName}`]);
          // Ignorer l'erreur de suppression de l'ancienne image
        }
      }

      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }

      toast({
        title: "Succès",
        description: "Votre photo de profil a été mise à jour",
      });

    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'upload de l'image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const { openPicker, desktopInputRef, handleFileSelected } = usePhotoPicker({
    onFileSelected: handleAvatarUpload,
  });

  const handleMobileFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleAvatarUpload(e);
      setPickerOpen(false);
    }
    e.target.value = '';
  }, [handleAvatarUpload]);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-probain-blue opacity-90 md:opacity-0" />
      <div className="hidden md:block absolute inset-0 bg-white/5 backdrop-blur-sm border-b border-white/10" />

      {/* Bouton action - Desktop uniquement (dans le layout horizontal ci-dessous) */}

      {/* Mobile: layout vertical centré */}
      <div className="relative px-4 py-8 flex flex-col items-center space-y-4 md:hidden">
        <div className="relative group">
          <div
            className="absolute -inset-2 rounded-full"
            style={{
              background: `conic-gradient(from 22.5deg, #EF4444 0deg 45deg, #FFFFFF 45deg 90deg, #EF4444 90deg 135deg, #FFFFFF 135deg 180deg, #EF4444 180deg 225deg, #FFFFFF 225deg 270deg, #EF4444 270deg 315deg, #FFFFFF 315deg 360deg)`,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)'
            }}
          />
          <Avatar className="relative w-32 h-32 border-4 border-white shadow-lg overflow-hidden rounded-full">
            <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} className="object-cover w-full h-full rounded-full" />
            <AvatarFallback className="text-lg bg-primary-light rounded-full">{`${firstName[0]}${lastName[0]}`}</AvatarFallback>
          </Avatar>
          {onAvatarUpdate && (
            <div role="button" tabIndex={0} onClick={() => setPickerOpen(true)} onKeyDown={(e) => e.key === 'Enter' && setPickerOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 rounded-full z-10">
              <Upload className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white text-center">
          {`${firstName.toUpperCase()} ${lastName.toUpperCase()}`}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {typeof age === 'number' && <span className="text-sm font-medium bg-white/20 px-4 py-1.5 rounded-full text-white">{age} ANS</span>}
          {address?.canton && (
            <span className="text-sm font-medium bg-white/20 px-4 py-1.5 rounded-full text-white flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {address.canton}
            </span>
          )}
          {phone && phoneVisible && viewerIsEstablishment && (
            <a href={`tel:${phone}`} className="text-sm font-medium bg-green-500/80 px-4 py-1.5 rounded-full text-white flex items-center gap-2">
              <Phone className="w-4 h-4" /> {phone}
            </a>
          )}
        </div>

        {certifications && certifications.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {certifications.map((cert, index) => (
              <Badge key={index} variant="secondary" className="bg-white/20 text-white hover:bg-white/30">{cert}</Badge>
            ))}
          </div>
        )}

        {biography && (
          <div className="w-full max-w-2xl bg-white/20 backdrop-blur-md rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full transform -translate-x-12 translate-y-12" />
            <div className="relative text-center">
              <span className="text-sm font-bold tracking-wider text-white uppercase">Biographie</span>
              <p className="text-sm text-white/90 whitespace-pre-wrap mt-2">{biography}</p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: layout horizontal (avatar gauche, info droite) */}
      <div className="relative hidden md:flex md:items-center md:gap-10 px-8 lg:px-12 py-10 lg:py-14">
        <div className="relative group transition-transform duration-300 hover:scale-105 flex-shrink-0">
          <div
            className="absolute -inset-3 lg:-inset-4 rounded-full"
            style={{
              background: `conic-gradient(from 22.5deg, #EF4444 0deg 45deg, #FFFFFF 45deg 90deg, #EF4444 90deg 135deg, #FFFFFF 135deg 180deg, #EF4444 180deg 225deg, #FFFFFF 225deg 270deg, #EF4444 270deg 315deg, #FFFFFF 315deg 360deg)`,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)'
            }}
          />
          <Avatar className="relative w-40 h-40 lg:w-48 lg:h-48 border-4 border-white shadow-lg overflow-hidden rounded-full">
            <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} className="object-cover w-full h-full rounded-full" />
            <AvatarFallback className="text-2xl lg:text-3xl bg-primary-light rounded-full">{`${firstName[0]}${lastName[0]}`}</AvatarFallback>
          </Avatar>
          {onAvatarUpdate && (
            <div role="button" tabIndex={0} onClick={openPicker} onKeyDown={(e) => e.key === 'Enter' && openPicker()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 rounded-full z-10">
              <Upload className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
              {`${firstName.toUpperCase()} ${lastName.toUpperCase()}`}
            </h1>
            {actionButton && (
              <div className="flex-shrink-0">
                {actionButton}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {typeof age === 'number' && (
              <span className="text-base font-medium bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 text-white transition-all">{age} ANS</span>
            )}
            {address?.canton && (
              <span className="text-base font-medium bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 text-white flex items-center gap-2 transition-all">
                <MapPin className="w-5 h-5" /> {address.canton}
              </span>
            )}
            {phone && phoneVisible && viewerIsEstablishment && (
              <a href={`tel:${phone}`} className="text-base font-medium bg-green-500/80 px-4 py-1.5 rounded-full hover:bg-green-500 text-white flex items-center gap-2 transition-all">
                <Phone className="w-5 h-5" /> {phone}
              </a>
            )}
          </div>

          {certifications && certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-base transition-all hover:scale-105">{cert}</Badge>
              ))}
            </div>
          )}

          {biography && (
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-5 max-w-2xl border border-white/10">
              <span className="text-xs font-bold tracking-wider text-white/60 uppercase">Biographie</span>
              <p className="text-sm text-white/90 whitespace-pre-wrap mt-1">{biography}</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: input file cache pour usePhotoPicker */}
      <input ref={desktopInputRef} type="file" accept="image/*" onChange={handleFileSelected} disabled={uploading} className="hidden" />

      {/* Mobile: PhotoPickerSheet avec refs externes (Android WebView fix) */}
      {onAvatarUpdate && (
        <PhotoPickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onFileSelected={handleAvatarUpload}
          uploading={uploading}
          title="Photo de profil"
          externalCameraRef={cameraRef}
          externalGalleryRef={galleryRef}
        />
      )}

      {/* Inputs file a la racine du composant (hors Portal Radix) pour Android WebView */}
      <input ref={cameraRef} type="file" accept="image/*" capture="user" onChange={handleMobileFileChange} disabled={uploading} className="hidden" aria-hidden="true" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleMobileFileChange} disabled={uploading} className="hidden" aria-hidden="true" />
    </div>
  );
};

