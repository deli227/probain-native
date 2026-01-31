import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useProfile } from "@/contexts/ProfileContext";

import { OnboardingShell } from "./OnboardingShell";
import { OnboardingProgress } from "./OnboardingProgress";
import { TrainerWelcome } from "./steps/TrainerWelcome";
import { TrainerOrganization } from "./steps/TrainerOrganization";
import { TrainerLogo } from "./steps/TrainerLogo";
import { TrainerDescription } from "./steps/TrainerDescription";
import { TrainerLocation } from "./steps/TrainerLocation";
import { TrainerComplete } from "./steps/TrainerComplete";

const TOTAL_STEPS = 6;
const STORAGE_KEY = "probain_trainer_onboarding";

// Types pour l'état persisté
interface PersistedState {
  step: number;
  organizationName: string;
  logoUrl: string;
  description: string;
  street: string;
  cityZip: string;
  canton: string;
}

// Charger l'état depuis localStorage
const loadPersistedState = (): PersistedState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
};

// Sauvegarder l'état dans localStorage
const savePersistedState = (state: PersistedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

// Nettoyer l'état persisté
const clearPersistedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
};

export const TrainerOnboardingFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useProfile();

  // Charger l'état initial depuis localStorage ou valeurs par défaut
  const persisted = loadPersistedState();

  const [step, setStep] = useState(persisted?.step ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data - initialisé depuis localStorage si disponible
  const [organizationName, setOrganizationName] = useState(persisted?.organizationName ?? "");
  const [logoUrl, setLogoUrl] = useState(persisted?.logoUrl ?? "");
  const [description, setDescription] = useState(persisted?.description ?? "");
  const [street, setStreet] = useState(persisted?.street ?? "");
  const [cityZip, setCityZip] = useState(persisted?.cityZip ?? "");
  const [canton, setCanton] = useState(persisted?.canton ?? "");
  const [orgLocked, setOrgLocked] = useState(false);

  // Charger le nom d'organisme existant depuis trainer_profiles (set par claim approval)
  useEffect(() => {
    const loadExistingOrg = async () => {
      try {
        const { data: { user } } = await safeGetUser(supabase, 5000);
        if (!user) return;

        const { data: trainerProfile } = await supabase
          .from('trainer_profiles')
          .select('organization_name')
          .eq('id', user.id)
          .maybeSingle();

        if (trainerProfile?.organization_name) {
          setOrganizationName(trainerProfile.organization_name);
          setOrgLocked(true);
        }
      } catch {
        // Silencieux
      }
    };

    if (!persisted?.organizationName) {
      loadExistingOrg();
    }
  }, []);

  // Persister l'état à chaque changement
  useEffect(() => {
    savePersistedState({
      step,
      organizationName,
      logoUrl,
      description,
      street,
      cityZip,
      canton,
    });
  }, [step, organizationName, logoUrl, description, street, cityZip, canton]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Vous devez sélectionner une image");
      }

      const file = event.target.files[0];

      // Validation taille fichier (5 MB max)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("L'image ne doit pas dépasser 5 MB");
      }

      const fileExt = file.name.split(".").pop();

      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Utilisateur non connecté");

      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);

      toast({
        title: "Succès",
        description: "Logo téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Utilisateur non connecté");

      // Mise à jour du profil de base
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: logoUrl || null,
          street: street || null,
          city_zip: cityZip || null,
          canton: canton || null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Mise à jour du profil formateur
      const { error: trainerError } = await supabase
        .from("trainer_profiles")
        .upsert({
          id: user.id,
          organization_name: organizationName,
          avatar_url: logoUrl || null,
          description: description || null,
          street: street || null,
          city_zip: cityZip || null,
          canton: canton || null,
        });

      if (trainerError) throw trainerError;

      // Nettoyer l'état persisté après succès
      clearPersistedState();

      toast({
        title: "Bienvenue !",
        description: "Votre profil formateur a été créé avec succès",
      });

      // Rafraîchir le cache du profil AVANT de naviguer
      // Cela garantit que onboarding_completed sera true dans le cache
      await refreshProfile();

      navigate("/trainer-profile", { replace: true });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création du profil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <TrainerWelcome onNext={handleNext} />;
      case 1:
        return (
          <TrainerOrganization
            organizationName={organizationName}
            onOrganizationNameChange={setOrganizationName}
            onNext={handleNext}
            onBack={handleBack}
            locked={orgLocked}
          />
        );
      case 2:
        return (
          <TrainerLogo
            logoUrl={logoUrl}
            organizationName={organizationName}
            uploading={uploading}
            onLogoUpload={handleLogoUpload}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <TrainerDescription
            description={description}
            onDescriptionChange={setDescription}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleNext}
          />
        );
      case 4:
        return (
          <TrainerLocation
            street={street}
            cityZip={cityZip}
            canton={canton}
            onStreetChange={setStreet}
            onCityZipChange={setCityZip}
            onCantonChange={setCanton}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleNext}
          />
        );
      case 5:
        return (
          <TrainerComplete
            organizationName={organizationName}
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingShell variant="trainer">
      {/* Progress indicator - caché sur welcome et complete */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <OnboardingProgress currentStep={step - 1} totalSteps={TOTAL_STEPS - 2} />
      )}

      {/* Contenu du step */}
      {renderStep()}
    </OnboardingShell>
  );
};
