import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useProfile } from "@/contexts/ProfileContext";
import { parseDateLocal, formatDateLocal } from "@/utils/dateUtils";

import { OnboardingShell } from "./OnboardingShell";
import { OnboardingProgress } from "./OnboardingProgress";
import { RescuerWelcome } from "./steps/RescuerWelcome";
import { RescuerIdentity } from "./steps/RescuerIdentity";
import { RescuerBirthdate } from "./steps/RescuerBirthdate";
import { RescuerPhoto } from "./steps/RescuerPhoto";
import { RescuerLocation } from "./steps/RescuerLocation";
import { RescuerComplete } from "./steps/RescuerComplete";

const TOTAL_STEPS = 6;
const STORAGE_KEY = "probain_rescuer_onboarding";

// Types pour l'état persisté
interface PersistedState {
  step: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  avatarUrl: string;
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

export const RescuerOnboardingFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useProfile();

  // Charger l'état initial depuis localStorage ou valeurs par défaut
  const persisted = loadPersistedState();

  const [step, setStep] = useState(persisted?.step ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form data - initialisé depuis localStorage si disponible
  const [firstName, setFirstName] = useState(persisted?.firstName ?? "");
  const [lastName, setLastName] = useState(persisted?.lastName ?? "");
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    persisted?.birthDate ? parseDateLocal(persisted.birthDate) : undefined
  );
  const [avatarUrl, setAvatarUrl] = useState(persisted?.avatarUrl ?? "");
  const [street, setStreet] = useState(persisted?.street ?? "");
  const [cityZip, setCityZip] = useState(persisted?.cityZip ?? "");
  const [canton, setCanton] = useState(persisted?.canton ?? "");

  // Persister l'état à chaque changement
  useEffect(() => {
    savePersistedState({
      step,
      firstName,
      lastName,
      birthDate: formatDateLocal(birthDate) ?? null,
      avatarUrl,
      street,
      cityZip,
      canton,
    });
  }, [step, firstName, lastName, birthDate, avatarUrl, street, cityZip, canton]);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setAvatarUrl(publicUrl);

      toast({
        title: "Succès",
        description: "Photo téléchargée avec succès",
      });
    } catch (error) {
      console.error('[Upload] Rescuer avatar error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du téléchargement",
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

      // Mise à jour du profil de base (null si vide pour éviter les contraintes)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          birth_date: formatDateLocal(birthDate) || null,
          avatar_url: avatarUrl || null,
          street: street || null,
          city_zip: cityZip || null,
          canton: canton || null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Mise à jour du profil sauveteur (null si vide)
      const { error: rescuerError } = await supabase
        .from("rescuer_profiles")
        .upsert({
          id: user.id,
          first_name: firstName || null,
          last_name: lastName || null,
          avatar_url: avatarUrl || null,
          canton: canton || null,
        });

      if (rescuerError) throw rescuerError;

      // Nettoyer l'état persisté après succès
      clearPersistedState();

      toast({
        title: "Bienvenue !",
        description: "Ton profil a été créé avec succès",
      });

      // Rafraîchir le cache du profil AVANT de naviguer
      // Cela garantit que onboarding_completed sera true dans le cache
      await refreshProfile();

      navigate("/profile", { replace: true });
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
        return <RescuerWelcome onNext={handleNext} />;
      case 1:
        return (
          <RescuerIdentity
            firstName={firstName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleNext}
          />
        );
      case 2:
        return (
          <RescuerBirthdate
            birthDate={birthDate}
            onBirthDateChange={setBirthDate}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleNext}
          />
        );
      case 3:
        return (
          <RescuerPhoto
            avatarUrl={avatarUrl}
            firstName={firstName}
            lastName={lastName}
            uploading={uploading}
            onAvatarUpload={handleAvatarUpload}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <RescuerLocation
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
          <RescuerComplete
            firstName={firstName}
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingShell variant="rescuer">
      {/* Progress indicator - caché sur welcome et complete */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <OnboardingProgress currentStep={step - 1} totalSteps={TOTAL_STEPS - 2} />
      )}

      {/* Contenu du step */}
      {renderStep()}
    </OnboardingShell>
  );
};
