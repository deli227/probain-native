import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";

type EstablishmentProfileRow = Database["public"]["Tables"]["establishment_profiles"]["Row"];
type EstablishmentProfileUpdate = Database["public"]["Tables"]["establishment_profiles"]["Update"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface EstablishmentProfileData extends ProfileRow {
  establishment: EstablishmentProfileRow;
}

// ------------------------------------------------------------------
// Query keys
// ------------------------------------------------------------------
const establishmentKeys = {
  all: ["establishment-profile"] as const,
  profile: () => ["establishment-profile", "data"] as const,
};

// ------------------------------------------------------------------
// Fetcher
// ------------------------------------------------------------------
async function fetchEstablishmentData(
  navigate: ReturnType<typeof useNavigate>,
): Promise<EstablishmentProfileData | null> {
  logger.log("Début du chargement du profil");
  const { data: { user } } = await safeGetUser(supabase);

  if (!user) {
    logger.log("Utilisateur non authentifié, redirection vers /auth");
    navigate('/auth');
    return null;
  }

  logger.log("Utilisateur authentifié:", user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    logger.error("Erreur lors du chargement du profil:", profileError);
    throw profileError;
  }

  if (!profile) {
    logger.log("Profil non trouvé, redirection vers /onboarding");
    navigate('/onboarding');
    return null;
  }

  const { data: establishmentProfile, error: establishmentError } = await supabase
    .from('establishment_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (establishmentError) {
    logger.error("Erreur lors du chargement du profil établissement:", establishmentError);
    throw establishmentError;
  }

  if (!establishmentProfile) {
    logger.log("Création d'un nouveau profil établissement");
    const { data: newProfile, error: createError } = await supabase
      .from('establishment_profiles')
      .insert({ id: user.id, organization_name: "Nouvel établissement" })
      .select()
      .single();

    if (createError) {
      logger.error("Erreur lors de la création du profil établissement:", createError);
      throw createError;
    }

    return { ...profile, establishment: newProfile };
  }

  return { ...profile, establishment: establishmentProfile };
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------
export const useEstablishmentProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: profileData = null,
    isLoading: loading,
  } = useQuery<EstablishmentProfileData | null>({
    queryKey: establishmentKeys.profile(),
    queryFn: () => fetchEstablishmentData(navigate),
  });

  // ---- Update mutation ----
  const updateMutation = useMutation({
    mutationFn: async (values: EstablishmentProfileUpdate) => {
      logger.log("Début de la mise à jour du profil");
      const { data: { user } } = await safeGetUser(supabase);

      if (!user) {
        logger.error("Utilisateur non authentifié");
        throw new Error('Non authentifié');
      }

      const { data, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (establishmentError) {
        logger.error('Erreur lors de la mise à jour:', establishmentError);
        throw establishmentError;
      }

      logger.log("Mise à jour réussie");
      return data;
    },
    onSuccess: (updatedEstablishment) => {
      // Optimistic update
      queryClient.setQueryData<EstablishmentProfileData | null>(
        establishmentKeys.profile(),
        (old) => old ? { ...old, establishment: updatedEstablishment } : null,
      );
    },
  });

  const handleProfileUpdate = useCallback(
    async (values: EstablishmentProfileUpdate) => {
      await updateMutation.mutateAsync(values);
    },
    [updateMutation],
  );

  return {
    profileData,
    loading,
    handleProfileUpdate,
  };
};
