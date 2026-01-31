import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RescuerOnboardingFlow } from "./RescuerOnboardingFlow";
import { TrainerOnboardingFlow } from "./TrainerOnboardingFlow";
import { EstablishmentOnboarding } from "./EstablishmentOnboarding";
import { Button } from "@/components/ui/button";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useProfile } from "@/contexts/ProfileContext";
import { CANTONS_SUISSES } from "@/utils/swissCantons";

export { CANTONS_SUISSES };

const ESTABLISHMENT_STORAGE_KEY = "probain_establishment_onboarding";

// Types pour les données d'onboarding
interface OnboardingAddress {
  street: string;
  cityZip: string;
  canton: string;
}

export interface OnboardingFormData {
  firstName: string;
  lastName: string;
  birthDate: Date;
  avatarUrl: string;
  address: OnboardingAddress;
  organizationName: string;
  description: string;
}

interface SpecificProfileData {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  street: string;
  city_zip: string;
  canton: string;
  organization_name?: string;
  description?: string;
}

// Charger l'état persisté pour établissement
const loadEstablishmentState = () => {
  try {
    const stored = localStorage.getItem(ESTABLISHMENT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return null;
};

// Sauvegarder l'état pour établissement
const saveEstablishmentState = (state: OnboardingFormData) => {
  try {
    localStorage.setItem(ESTABLISHMENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
};

// Nettoyer l'état persisté
const clearEstablishmentState = () => {
  try {
    localStorage.removeItem(ESTABLISHMENT_STORAGE_KEY);
  } catch {
    // Ignore
  }
};

export const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useProfile();

  // Charger l'état initial depuis localStorage
  const persisted = loadEstablishmentState();

  const [formData, setFormData] = useState({
    firstName: persisted?.firstName ?? "",
    lastName: persisted?.lastName ?? "",
    birthDate: persisted?.birthDate ? new Date(persisted.birthDate) : new Date(),
    avatarUrl: persisted?.avatarUrl ?? "",
    address: {
      street: persisted?.address?.street ?? "",
      cityZip: persisted?.address?.cityZip ?? "",
      canton: persisted?.address?.canton ?? "",
    },
    organizationName: persisted?.organizationName ?? "",
    description: persisted?.description ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [profileType, setProfileType] = useState<string | null>(null);

  // Persister l'état pour établissement
  useEffect(() => {
    if (profileType === 'etablissement') {
      saveEstablishmentState(formData);
    }
  }, [formData, profileType]);

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
      if (!user) throw new Error('Utilisateur non connecté');

      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatarUrl: publicUrl });

      toast({
        title: "Succès",
        description: "Votre photo de profil a été mise à jour",
      });

    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload de l'image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Mise à jour du profil de base
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate.toISOString(),
          avatar_url: formData.avatarUrl,
          street: formData.address.street,
          city_zip: formData.address.cityZip,
          canton: formData.address.canton,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Mise à jour du profil spécifique selon le type
      let specificProfileData: SpecificProfileData = {
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        avatar_url: formData.avatarUrl,
        street: formData.address.street,
        city_zip: formData.address.cityZip,
        canton: formData.address.canton,
      };

      let tableName: "rescuer_profiles" | "trainer_profiles" | "establishment_profiles";

      switch (profileType) {
        case 'maitre_nageur':
          tableName = 'rescuer_profiles';
          break;
        case 'formateur':
          tableName = 'trainer_profiles';
          specificProfileData = {
            ...specificProfileData,
            organization_name: formData.organizationName,
            description: formData.description,
          };
          break;
        case 'etablissement':
          tableName = 'establishment_profiles';
          specificProfileData = {
            ...specificProfileData,
            organization_name: formData.organizationName,
            description: formData.description,
          };
          break;
        default:
          throw new Error('Type de profil invalide');
      }

      const { error: specificProfileError } = await supabase
        .from(tableName)
        .upsert(specificProfileData);

      if (specificProfileError) {
        throw specificProfileError;
      }

      // Nettoyer l'état persisté après succès
      clearEstablishmentState();

      toast({
        title: "Succès",
        description: "Votre profil a été créé avec succès",
      });

      // Rafraîchir le cache du profil AVANT de naviguer
      await refreshProfile();

      // Redirection selon le type de profil
      switch (profileType) {
        case 'maitre_nageur':
          navigate('/profile', { replace: true });
          break;
        case 'formateur':
          navigate('/trainer-profile', { replace: true });
          break;
        case 'etablissement':
          navigate('/establishment-profile', { replace: true });
          break;
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du profil",
        variant: "destructive",
      });
    }
  };

  // Récupérer le type de profil au chargement
  useEffect(() => {
    const fetchProfileType = async () => {
      try {
        const { data: { user } } = await safeGetUser(supabase, 5000);
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', user.id)
            .single();
          
          if (error) {
            return;
          }
          
          if (profile) {
            setProfileType(profile.profile_type);
          }
        }
      } catch {
        // Erreur silencieuse lors du chargement du type de profil
      }
    };
    fetchProfileType();
  }, []);

  // Pour les sauveteurs, on utilise le nouveau flow modulaire
  if (profileType === 'maitre_nageur') {
    return <RescuerOnboardingFlow />;
  }

  // Pour les formateurs, on utilise le nouveau flow modulaire
  if (profileType === 'formateur') {
    return <TrainerOnboardingFlow />;
  }

  const renderOnboardingForm = () => {
    switch (profileType) {
      case 'etablissement':
        return (
          <EstablishmentOnboarding
            formData={formData}
            setFormData={setFormData}
            handleAvatarUpload={handleAvatarUpload}
            uploading={uploading}
          />
        );
      default:
        return <div>Type de profil non reconnu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 space-y-6">
        {renderOnboardingForm()}
        <Button
          onClick={handleSubmit}
          className="w-full mt-6"
        >
          Terminer
        </Button>
      </div>
    </div>
  );
};
