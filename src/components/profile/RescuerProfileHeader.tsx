
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Upload, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";

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

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-probain-blue opacity-90" />

      {/* Bouton action - Desktop only, top left (right is for availability) */}
      {actionButton && (
        <div className="hidden md:block absolute top-6 left-6 z-10">
          {actionButton}
        </div>
      )}

      <div className="relative px-4 py-8 md:py-16 lg:py-20 flex flex-col items-center space-y-4 md:space-y-8">
        <div className="relative group transition-transform duration-300 md:hover:scale-105">
          {/* Bouée de sauvetage - cercle extérieur */}
          <div
            className="absolute -inset-2 md:-inset-3 lg:-inset-4 rounded-full"
            style={{
              background: `conic-gradient(
                from 22.5deg,
                #EF4444 0deg 45deg,
                #FFFFFF 45deg 90deg,
                #EF4444 90deg 135deg,
                #FFFFFF 135deg 180deg,
                #EF4444 180deg 225deg,
                #FFFFFF 225deg 270deg,
                #EF4444 270deg 315deg,
                #FFFFFF 315deg 360deg
              )`,
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)'
            }}
          />

          <Avatar className="relative w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 border-4 border-white shadow-lg overflow-hidden rounded-full">
            <AvatarImage
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              className="object-cover w-full h-full rounded-full"
            />
            <AvatarFallback className="text-lg md:text-2xl lg:text-3xl bg-primary-light rounded-full">
              {`${firstName[0]}${lastName[0]}`}
            </AvatarFallback>
          </Avatar>

          {onAvatarUpdate && (
            <label
              className="absolute inset-0 flex items-center justify-center bg-black/50
                       opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300
                       rounded-full z-10"
              htmlFor="avatar-upload"
            >
              <Upload className="w-8 h-8 text-white transform transition-transform group-hover:scale-110" />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white text-center">
          {`${firstName.toUpperCase()} ${lastName.toUpperCase()}`}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          {typeof age === 'number' && (
            <span className="text-sm md:text-base lg:text-lg font-medium bg-white/20 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-white/30 text-white">
              {age} ANS
            </span>
          )}
          {address?.canton && (
            <span className="text-sm md:text-base lg:text-lg font-medium bg-white/20 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-white/30 text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              {address.canton}
            </span>
          )}
          {phone && phoneVisible && viewerIsEstablishment && (
            <a
              href={`tel:${phone}`}
              className="text-sm md:text-base lg:text-lg font-medium bg-green-500/80 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-green-500 text-white flex items-center gap-2"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
              {phone}
            </a>
          )}
        </div>

        {certifications && certifications.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
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

        {biography && (
          <div className="w-full max-w-2xl bg-white/20 backdrop-blur-md rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full transform -translate-x-12 translate-y-12" />
            <div className="relative">
              <div className="flex justify-center mb-2">
                <span className="text-sm font-bold tracking-wider text-white uppercase">
                  Biographie
                </span>
              </div>
              <p className="text-sm text-white/90 whitespace-pre-wrap text-center">
                {biography}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
