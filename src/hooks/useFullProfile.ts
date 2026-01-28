import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ProfileType } from '@/contexts/types/profile';

/**
 * Query keys pour le cache TanStack Query
 */
export const PROFILE_KEYS = {
  all: ['profile'] as const,
  base: (userId: string) => [...PROFILE_KEYS.all, 'base', userId] as const,
  full: (userId: string) => [...PROFILE_KEYS.all, 'full', userId] as const,
  rescuer: (userId: string) => [...PROFILE_KEYS.all, 'rescuer', userId] as const,
  trainer: (userId: string) => [...PROFILE_KEYS.all, 'trainer', userId] as const,
  establishment: (userId: string) => [...PROFILE_KEYS.all, 'establishment', userId] as const,
};

/**
 * Types pour les données de profil
 */
export interface BaseProfile {
  id: string;
  email: string | null;
  profile_type: ProfileType | null;
  profile_type_selected: boolean | null;
  onboarding_completed: boolean | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  biography: string | null;
  birth_date: string | null;
  street: string | null;
  city_zip: string | null;
  canton: string | null;
  created_at: string;
  updated_at: string;
}

export interface RescuerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone_visible: boolean | null;
  availability_status: boolean | null;
  is_always_available: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface TrainerProfile {
  id: string;
  organization_name: string | null;
  description: string | null;
  region: string | null;
  canton: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  certifications: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentProfile {
  id: string;
  organization_name: string | null;
  street: string | null;
  city_zip: string | null;
  canton: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FullProfileData {
  base: BaseProfile;
  rescuer?: RescuerProfile | null;
  trainer?: TrainerProfile | null;
  establishment?: EstablishmentProfile | null;
}

/**
 * Fonction pour charger le profil complet en une seule requête batch
 */
async function fetchFullProfile(userId: string): Promise<FullProfileData | null> {
  logger.log('[useFullProfile] Fetching full profile for:', userId);

  // Requête du profil de base
  const { data: baseProfile, error: baseError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (baseError) {
    logger.error('[useFullProfile] Error fetching base profile:', baseError);
    throw baseError;
  }

  if (!baseProfile) {
    logger.log('[useFullProfile] No base profile found');
    return null;
  }

  const result: FullProfileData = { base: baseProfile as BaseProfile };

  // Charger le profil spécifique selon le type
  const profileType = baseProfile.profile_type as ProfileType | null;

  if (profileType === 'maitre_nageur') {
    const { data: rescuerProfile } = await supabase
      .from('rescuer_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    result.rescuer = rescuerProfile as RescuerProfile | null;
  } else if (profileType === 'formateur') {
    const { data: trainerProfile } = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    result.trainer = trainerProfile as TrainerProfile | null;
  } else if (profileType === 'etablissement') {
    const { data: establishmentProfile } = await supabase
      .from('establishment_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    result.establishment = establishmentProfile as EstablishmentProfile | null;
  }

  logger.log('[useFullProfile] Full profile loaded:', profileType);
  return result;
}

/**
 * Hook principal pour charger le profil complet avec cache persistant
 *
 * Avantages:
 * - Une seule source de vérité pour toutes les données du profil
 * - Cache persistant dans localStorage (survit aux refresh)
 * - Stale-while-revalidate: affiche le cache immédiatement, refresh en background
 * - Partagé entre toutes les pages (pas de re-fetch)
 */
export function useFullProfile(userId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: userId ? PROFILE_KEYS.full(userId) : ['profile', 'none'],
    queryFn: async () => {
      if (!userId) return null;
      return fetchFullProfile(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - données considérées fraîches
    gcTime: 24 * 60 * 60 * 1000, // 24 heures - garde en cache pour PWA
    refetchOnWindowFocus: false, // Pas de refetch au focus (PWA)
    refetchOnReconnect: 'always', // Refetch quand on revient en ligne
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    placeholderData: (previousData) => previousData, // Stale-while-revalidate
  });

  // Fonctions utilitaires pour invalider/rafraîchir
  const invalidateProfile = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.full(userId) });
    }
  };

  const refetchProfile = () => {
    return query.refetch();
  };

  // Mutation optimiste pour mise à jour locale immédiate
  const updateProfileOptimistic = (updates: Partial<FullProfileData>) => {
    if (!userId) return;

    queryClient.setQueryData(PROFILE_KEYS.full(userId), (old: FullProfileData | null) => {
      if (!old) return old;
      return {
        ...old,
        ...updates,
        base: updates.base ? { ...old.base, ...updates.base } : old.base,
        rescuer: updates.rescuer !== undefined ? updates.rescuer : old.rescuer,
        trainer: updates.trainer !== undefined ? updates.trainer : old.trainer,
        establishment: updates.establishment !== undefined ? updates.establishment : old.establishment,
      };
    });
  };

  return {
    // Données
    data: query.data,
    baseProfile: query.data?.base ?? null,
    rescuerProfile: query.data?.rescuer ?? null,
    trainerProfile: query.data?.trainer ?? null,
    establishmentProfile: query.data?.establishment ?? null,

    // États
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    // Données dérivées pratiques
    profileType: query.data?.base?.profile_type ?? null,
    profileTypeSelected: query.data?.base?.profile_type_selected ?? false,
    onboardingCompleted: query.data?.base?.onboarding_completed ?? false,

    // Actions
    invalidateProfile,
    refetchProfile,
    updateProfileOptimistic,
  };
}

/**
 * Hook pour précharger le profil (navigation anticipée)
 */
export function usePrefetchProfile() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: PROFILE_KEYS.full(userId),
      queryFn: () => fetchFullProfile(userId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
