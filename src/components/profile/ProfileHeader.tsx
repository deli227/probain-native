
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Upload, Globe, Facebook, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";


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
      
      // Validation taille fichier (5 MB max)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('L\'image ne doit pas dépasser 5 MB');
      }

      const fileExt = file.name.split('.').pop();
      
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      // Supprimer l'ancienne image si elle existe
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

      // Mettre à jour la table profiles (commune à tous les types)
      // La table spécifique (*_profiles) est mise à jour par le callback onAvatarUpdate du parent
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

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

  const socialLinks = [
    { url: website, icon: Globe, label: 'Site web' },
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
  ].filter(l => l.url);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-probain-blue opacity-90 md:opacity-0" />
      <div className="hidden md:block absolute inset-0 bg-white/5 backdrop-blur-sm border-b border-white/10" />

      {/* Mobile: layout vertical centré */}
      <div className="relative px-4 py-8 flex flex-col items-center space-y-4 md:hidden">
        <div className="relative group">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg overflow-hidden rounded-full">
            <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} className="object-cover w-full h-full rounded-full" />
            <AvatarFallback className="text-lg bg-primary-light rounded-full">{`${firstName[0]}${lastName ? lastName[0] : ''}`}</AvatarFallback>
          </Avatar>
          {onAvatarUpdate && (
            <div role="button" tabIndex={0} onClick={openPicker} onKeyDown={(e) => e.key === 'Enter' && openPicker()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 rounded-full">
              <Upload className="w-8 h-8 text-white" />
            </div>
          )}
          <input ref={desktopInputRef} type="file" accept="image/*" onChange={handleFileSelected} disabled={uploading} className="hidden" />
        </div>

        <div className="text-white text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{`${firstName.toUpperCase()} ${lastName.toUpperCase()}`}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-white/90 mb-3">
            {age && <span className="text-sm font-medium bg-white/20 px-4 py-1.5 rounded-full">{age} ANS</span>}
            {address?.canton && (
              <div className="flex items-center gap-2 text-sm bg-white/20 px-4 py-1.5 rounded-full">
                <MapPin className="w-4 h-4" /> <span>{address.canton}</span>
              </div>
            )}
          </div>
          {address && (address.street || address.cityZip) && (
            <div className="flex flex-col items-center gap-1 text-sm text-white/90 mb-3">
              {address.street && <span>{address.street}</span>}
              {address.cityZip && <span>{address.cityZip}</span>}
            </div>
          )}
          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-4 text-white/90 mb-3">
              {socialLinks.map(({ url, icon: Icon, label }) => (
                <a key={label} href={url!.startsWith('http') ? url! : `https://${url}`} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all" title={label}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
          {certifications && certifications.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {certifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="bg-white/20 text-white hover:bg-white/30">{cert}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: layout horizontal (avatar gauche, info droite) */}
      <div className="relative hidden md:flex md:items-center md:gap-10 px-8 lg:px-12 py-10 lg:py-14">
        <div className="relative group transition-transform duration-300 hover:scale-105 flex-shrink-0">
          <Avatar className="w-40 h-40 lg:w-48 lg:h-48 border-4 border-white shadow-lg overflow-hidden rounded-full">
            <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} className="object-cover w-full h-full rounded-full" />
            <AvatarFallback className="text-2xl lg:text-3xl bg-primary-light rounded-full">{`${firstName[0]}${lastName ? lastName[0] : ''}`}</AvatarFallback>
          </Avatar>
          {onAvatarUpdate && (
            <div role="button" tabIndex={0} onClick={openPicker} onKeyDown={(e) => e.key === 'Enter' && openPicker()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 rounded-full">
              <Upload className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
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

          <div className="flex flex-wrap items-center gap-3 text-white/90">
            {age && <span className="text-base font-medium bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 transition-all">{age} ANS</span>}
            {address?.canton && (
              <div className="flex items-center gap-2 text-base bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 transition-all">
                <MapPin className="w-5 h-5" /> <span>{address.canton}</span>
              </div>
            )}
          </div>

          {address && (address.street || address.cityZip) && (
            <div className="text-base text-white/70">
              {address.street && <span>{address.street}</span>}
              {address.street && address.cityZip && <span> · </span>}
              {address.cityZip && <span>{address.cityZip}</span>}
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="flex gap-5 text-white/70">
              {socialLinks.map(({ url, icon: Icon, label }) => (
                <a key={label} href={url!.startsWith('http') ? url! : `https://${url}`} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all" title={label}>
                  <Icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-base transition-all hover:scale-105">{cert}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

