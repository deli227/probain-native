
import { useState, useRef, useEffect, useCallback } from "react";
import { ProfileType } from "../types/profile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useProfileQuery, PROFILE_QUERY_KEY } from "@/hooks/useProfileQuery";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

// Clé pour sessionStorage - persiste pendant la session du navigateur
const PROFILE_LOADED_KEY = 'probain_profile_loaded_session';

// Vérifier si le profil a déjà été chargé dans cette session
const getSessionProfileLoaded = (): boolean => {
  try {
    return sessionStorage.getItem(PROFILE_LOADED_KEY) === 'true';
  } catch {
    return false;
  }
};

// Marquer le profil comme chargé dans cette session
const setSessionProfileLoaded = () => {
  try {
    sessionStorage.setItem(PROFILE_LOADED_KEY, 'true');
  } catch {
    // Ignorer les erreurs de sessionStorage
  }
};

export const useProfileState = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // État pour l'ID utilisateur courant
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Utiliser TanStack Query pour le profil
  const {
    data: profile,
    isLoading: queryLoading,
    isFetching,
    error: queryError,
    refetch
  } = useProfileQuery(currentUserId);

  // Vérifier le cache localStorage pour les valeurs initiales (fallback)
  const getCachedProfile = useCallback(() => {
    try {
      const cachedType = localStorage.getItem('probain_profile_type') as ProfileType | null;
      const cachedSelected = localStorage.getItem('probain_profile_selected') === 'true';
      const cachedOnboarding = localStorage.getItem('probain_onboarding_completed') === 'true';
      return { cachedType, cachedSelected, cachedOnboarding };
    } catch {
      return { cachedType: null, cachedSelected: false, cachedOnboarding: false };
    }
  }, []);

  const cached = getCachedProfile();
  const alreadyLoadedThisSession = getSessionProfileLoaded();

  // États dérivés du profil TanStack Query avec fallback sur le cache local
  const profileTypeSelected = profile?.profile_type_selected ?? cached.cachedSelected;
  const onboardingCompleted = profile?.onboarding_completed ?? cached.cachedOnboarding;
  const profileType = (profile?.profile_type as ProfileType | null) ?? cached.cachedType;

  // Loading: true seulement si on n'a pas de données du tout (ni query, ni cache)
  const hasAnyData = !!profile || !!cached.cachedType;
  const loading = !isInitialized || (queryLoading && !hasAnyData && !alreadyLoadedThisSession);

  // Profil vérifié si on a des données et pas d'erreur
  const profileVerified = !!profile || (alreadyLoadedThisSession && !!cached.cachedType);

  // Ref pour suivre si on a déjà eu un profileType
  const hasHadProfileType = useRef(alreadyLoadedThisSession || !!cached.cachedType);

  // Setters manuels pour permettre les mises à jour optimistes
  const [manualProfileType, setManualProfileType] = useState<ProfileType | null>(null);
  const [manualProfileTypeSelected, setManualProfileTypeSelected] = useState<boolean | null>(null);
  const [manualOnboardingCompleted, setManualOnboardingCompleted] = useState<boolean | null>(null);

  // Valeurs finales (TanStack Query prioritaire, puis manuel, puis cache)
  const finalProfileType = manualProfileType ?? profileType;
  const finalProfileTypeSelected = manualProfileTypeSelected ?? profileTypeSelected;
  const finalOnboardingCompleted = manualOnboardingCompleted ?? onboardingCompleted;

  // Ref pour tracker le userId précédent (pour détecter les changements)
  const prevUserIdRef = useRef<string | null>(null);

  // Initialiser l'ID utilisateur au montage ET écouter les changements d'auth
  useEffect(() => {
    let mounted = true;

    const initUser = async () => {
      try {
        const { data: { user } } = await safeGetUser(supabase, 5000);
        if (mounted) {
          setCurrentUserId(user?.id || null);
          setIsInitialized(true);
          logger.log('[useProfileState] Initialized with userId:', user?.id);
        }
      } catch (error) {
        logger.error('[useProfileState] Error initializing user:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initUser();

    // Écouter les changements d'authentification pour mettre à jour le userId
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const newUserId = session?.user?.id || null;
      logger.log('[useProfileState] Auth state changed:', _event, 'userId:', newUserId);

      // Toujours mettre à jour le userId quand l'auth change
      setCurrentUserId(newUserId);
      setIsInitialized(true);

      // Si déconnexion, reset les états manuels
      if (_event === 'SIGNED_OUT') {
        setManualProfileType(null);
        setManualProfileTypeSelected(null);
        setManualOnboardingCompleted(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refetch automatique quand le userId change (résout le problème de l'écran blanc)
  useEffect(() => {
    // Ne rien faire si le userId n'a pas changé ou si on n'est pas encore initialisé
    if (!isInitialized) return;
    if (currentUserId === prevUserIdRef.current) return;

    logger.log('[useProfileState] UserId changed from', prevUserIdRef.current, 'to', currentUserId);
    prevUserIdRef.current = currentUserId;

    // Si on a un nouveau userId, invalider et refetch le profil
    if (currentUserId) {
      logger.log('[useProfileState] Invalidating profile query for new user');
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    }
  }, [currentUserId, isInitialized, queryClient]);

  // Mettre à jour le cache localStorage quand le profil change
  useEffect(() => {
    if (profile?.profile_type) {
      hasHadProfileType.current = true;
      setSessionProfileLoaded();
      localStorage.setItem('probain_profile_type', profile.profile_type);
      localStorage.setItem('probain_profile_selected', String(profile.profile_type_selected ?? false));
      localStorage.setItem('probain_onboarding_completed', String(profile.onboarding_completed ?? false));
      logger.log('[useProfileState] Profile cached to localStorage:', profile.profile_type);
    }
  }, [profile]);

  // Afficher erreur si la query échoue
  useEffect(() => {
    if (queryError && isInitialized && currentUserId) {
      logger.error('[useProfileState] Query error:', queryError);
      // Ne pas montrer de toast si on a des données en cache
      if (!hasAnyData) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les informations du profil. Réessai automatique...",
          variant: "destructive",
        });
      }
    }
  }, [queryError, isInitialized, currentUserId, hasAnyData, toast]);

  // Fonction checkProfile - invalide le cache pour forcer un refetch
  const checkProfile = useCallback(async () => {
    logger.log('[useProfileState] checkProfile called');

    try {
      // Vérifier l'utilisateur actuel
      const { data: { user } } = await safeGetUser(supabase, 5000);

      if (!user) {
        logger.log('[useProfileState] No user found');
        setCurrentUserId(null);
        setManualProfileType(null);
        setManualProfileTypeSelected(null);
        setManualOnboardingCompleted(null);
        return;
      }

      // Mettre à jour l'ID si différent (cela déclenchera un refetch via useEffect)
      if (user.id !== currentUserId) {
        logger.log('[useProfileState] Setting new userId:', user.id);
        setCurrentUserId(user.id);
      } else {
        // Si même user, forcer un refetch via invalidation
        logger.log('[useProfileState] Same user, invalidating query');
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      }
    } catch (error) {
      logger.error('[useProfileState] Error in checkProfile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du profil",
        variant: "destructive",
      });
    }
  }, [currentUserId, queryClient, toast]);

  // Setters qui mettent à jour l'état local ET invalident le cache
  const setProfileType = useCallback((type: ProfileType | null) => {
    setManualProfileType(type);
    if (type) {
      localStorage.setItem('probain_profile_type', type);
    }
    // Invalider le cache pour forcer un refetch au prochain accès
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  }, [queryClient]);

  const setProfileTypeSelected = useCallback((selected: boolean) => {
    setManualProfileTypeSelected(selected);
    localStorage.setItem('probain_profile_selected', String(selected));
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  }, [queryClient]);

  const setOnboardingCompleted = useCallback((completed: boolean) => {
    setManualOnboardingCompleted(completed);
    localStorage.setItem('probain_onboarding_completed', String(completed));
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  }, [queryClient]);

  const setLoading = useCallback((_loading: boolean) => {
    // No-op - le loading est géré par TanStack Query
    // Cette fonction existe pour la compatibilité avec l'interface existante
  }, []);

  const setProfileVerified = useCallback((_verified: boolean) => {
    // No-op - profileVerified est dérivé de l'état de la query
    // Cette fonction existe pour la compatibilité avec l'interface existante
  }, []);

  return {
    profileTypeSelected: finalProfileTypeSelected,
    setProfileTypeSelected,
    onboardingCompleted: finalOnboardingCompleted,
    setOnboardingCompleted,
    profileType: finalProfileType,
    setProfileType,
    loading,
    setLoading,
    profileVerified,
    setProfileVerified,
    checkProfile
  };
};
