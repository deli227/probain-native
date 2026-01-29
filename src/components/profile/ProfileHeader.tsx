
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Upload, Globe, Facebook, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { PhotoPickerSheet } from "@/components/shared/PhotoPickerSheet";

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  age?: number;
  address?: {
    street: string;
    cityZip: string;
    canton: string;
  };
  biography?: string;
  website?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  certifications?: string[];
  onAvatarUpdate?: (url: string) => void;
  /** Bouton d'action affiché en haut à gauche sur desktop */
  actionButton?: React.ReactNode;
}

export const ProfileHeader = ({
  firstName,
  lastName,
  age,
  address,
  biography,
  website,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  avatarUrl,
  certifications = [],
  onAvatarUpdate,
  actionButton
}: ProfileHeaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      // Supprimer l'ancienne image si elle existe
      if (avatarUrl) {
        const oldFileName = avatarUrl.split('/').pop();
        if (oldFileName) {
          const { error: removeError } = await supabase.storage
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

      // Mettre à jour les deux tables avec la nouvelle URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: establishmentError } = await supabase
        .from('establishment_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (establishmentError) throw establishmentError;

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

  const { isPickerOpen, openPicker, setPickerOpen, desktopInputRef, handleFileSelected } = usePhotoPicker({
    onFileSelected: handleAvatarUpload,
  });

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-probain-blue opacity-90" />

      {/* Bouton action - Desktop only, top left */}
      {actionButton && (
        <div className="hidden md:block absolute top-6 left-6 z-10">
          {actionButton}
        </div>
      )}

      <div className="relative px-4 py-8 md:py-16 lg:py-20 flex flex-col items-center space-y-4 md:space-y-8 max-w-7xl mx-auto">
        <div className="relative group transition-transform duration-300 md:hover:scale-105">
          <Avatar className="w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 border-4 border-white shadow-lg overflow-hidden rounded-full">
            <AvatarImage
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              className="object-cover w-full h-full rounded-full"
            />
            <AvatarFallback className="text-lg md:text-2xl lg:text-3xl bg-primary-light rounded-full">
              {`${firstName[0]}${lastName ? lastName[0] : ''}`}
            </AvatarFallback>
          </Avatar>
          
          {onAvatarUpdate && (
            <div
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={(e) => e.key === 'Enter' && openPicker()}
              className="absolute inset-0 flex items-center justify-center bg-black/50
                       opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300
                       rounded-full"
            >
              <Upload className="w-8 h-8 text-white transform transition-transform group-hover:scale-110" />
            </div>
          )}
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
        
        <div className="text-white text-center md:max-w-3xl lg:max-w-4xl animate-fade-in">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2 md:mb-6">
            {`${firstName.toUpperCase()} ${lastName.toUpperCase()}`}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-white/90 mb-3 md:mb-6">
            {age && (
              <span className="text-sm md:text-base lg:text-lg font-medium bg-white/20 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-white/30">
                {age} ANS
              </span>
            )}
            {address?.canton && (
              <div className="flex items-center gap-2 text-sm md:text-base lg:text-lg bg-white/20 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-white/30">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                <span>{address.canton}</span>
              </div>
            )}
          </div>

          {address && (address.street || address.cityZip) && (
            <div className="flex flex-col items-center gap-1 text-sm md:text-base lg:text-lg text-white/90 mb-3 md:mb-6">
              {address.street && <span className="transition-all duration-300 hover:text-white">{address.street}</span>}
              {address.cityZip && <span className="transition-all duration-300 hover:text-white">{address.cityZip}</span>}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-white/90 mb-3 md:mb-6">
            <div className="flex gap-4 md:gap-8">
              {website && (
                <a 
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform transition-all duration-300 hover:text-white hover:scale-110"
                  title="Site web"
                >
                  <Globe className="w-5 h-5 md:w-7 md:h-7" />
                </a>
              )}
              {facebookUrl && (
                <a 
                  href={facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform transition-all duration-300 hover:text-white hover:scale-110"
                  title="Facebook"
                >
                  <Facebook className="w-5 h-5 md:w-7 md:h-7" />
                </a>
              )}
              {instagramUrl && (
                <a 
                  href={instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform transition-all duration-300 hover:text-white hover:scale-110"
                  title="Instagram"
                >
                  <Instagram className="w-5 h-5 md:w-7 md:h-7" />
                </a>
              )}
              {linkedinUrl && (
                <a 
                  href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform transition-all duration-300 hover:text-white hover:scale-110"
                  title="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 md:w-7 md:h-7" />
                </a>
              )}
            </div>
          </div>

          {certifications && certifications.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-4 md:mt-8">
              {certifications.map((cert, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 md:text-lg transition-all duration-300 transform hover:scale-105"
                >
                  {cert}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {onAvatarUpdate && (
        <PhotoPickerSheet
          open={isPickerOpen}
          onOpenChange={setPickerOpen}
          onFileSelected={handleFileSelected}
          uploading={uploading}
          cameraFacing="user"
          title="Photo de profil"
        />
      )}
    </div>
  );
};
