import { createContext, useContext, useEffect, ReactNode, useState, useCallback, useMemo } from "react";
import { ProfileContextType, ProfileType } from "./types/profile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useFullProfile, FullProfileData } from "@/hooks/useFullProfile";
import { useQueryClient } from "@tanstack/react-query";
import { PROFILE_KEYS } from "@/hooks/useFullProfile";
import { useOneSignalPush, cleanupOneSignalOnLogout } from "@/hooks/useOneSignalPush";
import { appLogger } from "@/services/appLogger";

// Étendre le type pour inclure les nouvelles données
interface ExtendedProfileContextType extends ProfileContextType {
  // Données complètes du profil
  fullProfile: FullProfileData | null;
  baseProfile: FullProfileData['base'] | null;
  rescuerProfile: FullProfileData['rescuer'] | null;
  trainerProfile: FullProfileData['trainer'] | null;
  establishmentProfile: FullProfileData['establishment'] | null;

  // Actions
  refreshProfile: () => Promise<void>;
  updateProfileOptimistic: (updates: Partial<FullProfileData>) => void;
}

const ProfileContext = createContext<ExtendedProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // État pour l'ID utilisateur - source unique
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Hook unifié pour toutes les données du profil
  const {
    data: fullProfile,
    baseProfile,
    rescuerProfile,
    trainerProfile,
    establishmentProfile,
    profileType,
    profileTypeSelected,
    onboardingCompleted,
    isLoading,
    invalidateProfile,
    refetchProfile,
    updateProfileOptimistic,
  } = useFullProfile(currentUserId);

  // Initialisation OneSignal Push (native Despia uniquement)
  useOneSignalPush(currentUserId, profileType);

  // Calculer loading intelligemment:
  // - true seulement si on n'a PAS de données ET qu'on est en train de charger
  // - false dès qu'on a des données (même stale)
  const hasData = !!fullProfile?.base;
  const loading = !isInitialized || (isLoading && !hasData);

  // Profil vérifié = on a des données valides
  const profileVerified = hasData && !isLoading;

  // Gestion du statut online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Rafraîchir le profil quand on revient en ligne
      if (currentUserId) {
        invalidateProfile();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUserId, invalidateProfile]);

  // UN SEUL listener pour l'authentification
  useEffect(() => {
    let mounted = true;

    // Récupérer la session initiale
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          const userId = session?.user?.id || null;
          logger.log('[ProfileContext] Initial session:', userId ? 'authenticated' : 'none');
          setCurrentUserId(userId);
          setIsInitialized(true);
        }
      } catch (error) {
        logger.error('[ProfileContext] Error getting initial session:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const newUserId = session?.user?.id || null;
      logger.log('[ProfileContext] Auth state changed:', _event, 'userId:', newUserId);

      // Mettre à jour l'ID utilisateur (déclenche automatiquement useFullProfile)
      setCurrentUserId(newUserId);
      setIsInitialized(true);

      // Si déconnexion, nettoyer le cache complet + OneSignal + appLogger
      if (_event === 'SIGNED_OUT') {
        appLogger.clearUser();
        cleanupOneSignalOnLogout();
        queryClient.clear();
        localStorage.removeItem('PROBAIN_QUERY_CACHE');
        localStorage.removeItem('probain_profile_type');
        localStorage.removeItem('probain_onboarding_completed');
        localStorage.removeItem('probain_profile_selected');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Synchroniser appLogger avec l'utilisateur courant
  useEffect(() => {
    if (currentUserId && profileType) {
      appLogger.setUser(currentUserId, profileType);
    } else if (!currentUserId) {
      appLogger.clearUser();
    }
  }, [currentUserId, profileType]);

  // Sauvegarder dans localStorage pour le fallback offline
  useEffect(() => {
    if (profileType) {
      localStorage.setItem('probain_profile_type', profileType);
    }
    if (profileTypeSelected !== null) {
      localStorage.setItem('probain_profile_selected', String(profileTypeSelected));
    }
    if (onboardingCompleted !== null) {
      localStorage.setItem('probain_onboarding_completed', String(onboardingCompleted));
    }
  }, [profileType, profileTypeSelected, onboardingCompleted]);

  // Fonction pour mettre à jour le type de profil
  const updateProfileType = useCallback(async (type: ProfileType) => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "Cette action nécessite une connexion internet.",
        variant: "destructive",
      });
      return false;
    }

    if (!currentUserId) {
      logger.error('[ProfileContext] Cannot update profile type: no user');
      return false;
    }

    try {
      // Mise à jour optimiste
      updateProfileOptimistic({
        base: {
          ...baseProfile!,
          profile_type: type,
          profile_type_selected: true,
        }
      });

      // Mise à jour en DB
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_type: type,
          profile_type_selected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId);

      if (error) throw error;

      // Rafraîchir pour obtenir les données à jour
      await refetchProfile();

      logger.log('[ProfileContext] Profile type updated to:', type);
      return true;
    } catch (error) {
      logger.error('[ProfileContext] Error updating profile type:', error);
      // Revert optimistic update
      invalidateProfile();
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le type de profil",
        variant: "destructive",
      });
      return false;
    }
  }, [currentUserId, isOnline, baseProfile, updateProfileOptimistic, refetchProfile, invalidateProfile, toast]);

  // Wrapper pour rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    await refetchProfile();
  }, [refetchProfile]);

  const contextValue = useMemo(() => ({
    // Données de base (compatibilité avec l'ancienne interface)
    profileTypeSelected,
    onboardingCompleted,
    profileType,
    loading,
    profileVerified,
    isOnline,
    updateProfileType,

    // Nouvelles données complètes
    fullProfile: fullProfile ?? null,
    baseProfile: baseProfile ?? null,
    rescuerProfile: rescuerProfile ?? null,
    trainerProfile: trainerProfile ?? null,
    establishmentProfile: establishmentProfile ?? null,

    // Actions
    refreshProfile,
    updateProfileOptimistic,
  }), [
    profileTypeSelected,
    onboardingCompleted,
    profileType,
    loading,
    profileVerified,
    isOnline,
    updateProfileType,
    fullProfile,
    baseProfile,
    rescuerProfile,
    trainerProfile,
    establishmentProfile,
    refreshProfile,
    updateProfileOptimistic,
  ]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile doit être utilisé à l\'intérieur d\'un ProfileProvider');
  }
  return context;
}
