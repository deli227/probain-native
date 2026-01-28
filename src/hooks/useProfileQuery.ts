import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { ProfileType } from '@/contexts/types/profile';

/**
 * Query key pour le profil utilisateur
 * Utilisé pour l'invalidation et la mise en cache
 */
export const PROFILE_QUERY_KEY = ['profile'] as const;

/**
 * Type de retour du profil depuis Supabase
 */
export interface ProfileData {
  id: string;
  email: string | null;
  profile_type: ProfileType | null;
  profile_type_selected: boolean | null;
  onboarding_completed: boolean | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook TanStack Query pour charger le profil utilisateur
 *
 * Avantages:
 * - Cache automatique persisté dans localStorage
 * - Retry intelligent avec backoff exponentiel
 * - Mode offline-first (affiche le cache immédiatement)
 * - Stale-while-revalidate (affiche le cache pendant le refresh)
 *
 * @param userId - ID de l'utilisateur (null si pas connecté)
 * @returns Query result avec data, isLoading, error, refetch
 */
export const useProfileQuery = (userId: string | null) => {
  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, userId],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!userId) {
        logger.log('[useProfileQuery] No userId, returning null');
        return null;
      }

      logger.log('[useProfileQuery] Fetching profile for:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('[useProfileQuery] Error fetching profile:', error);
        throw error;
      }

      logger.log('[useProfileQuery] Profile loaded successfully:', data?.profile_type);
      return data as ProfileData;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 heures
    placeholderData: (previousData) => previousData, // Stale-while-revalidate
  });
};
