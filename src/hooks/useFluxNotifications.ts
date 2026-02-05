import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetUser } from '@/utils/asyncHelpers';
import { appLogger } from '@/services/appLogger';

const LAST_SEEN_FLUX_KEY = 'probain_last_seen_flux';

interface UseFluxNotificationsReturn {
  newPostsCount: number;
  isLoading: boolean;
  markAsSeen: () => void;
  refetch: () => Promise<void>;
}

// Cache module-level : survit aux remontages de composants, evite le flash des badges a 0
let cachedNewPostsCount: number | null = null;

/**
 * Hook pour compter les nouveaux posts du flux depuis la dernière visite
 * - Stocke la dernière visite en localStorage
 * - Écoute en temps réel les nouveaux posts
 */
export function useFluxNotifications(): UseFluxNotificationsReturn {
  const [newPostsCount, setNewPostsCount] = useState(cachedNewPostsCount ?? 0);
  const [isLoading, setIsLoading] = useState(cachedNewPostsCount === null);
  const [userId, setUserId] = useState<string | null>(null);

  const getLastSeenFlux = useCallback((): string => {
    try {
      const stored = localStorage.getItem(LAST_SEEN_FLUX_KEY);
      if (stored) {
        return stored;
      }
    } catch {
      // localStorage non disponible
    }
    // Par défaut, considérer que l'utilisateur n'a rien vu depuis 7 jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo.toISOString();
  }, []);

  const fetchNewPostsCount = useCallback(async () => {
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      const lastSeen = getLastSeenFlux();

      // Compter les posts publiés depuis la dernière visite
      const now = new Date().toISOString();
      const { count, error } = await supabase
        .from('flux_posts')
        .select('*', { count: 'exact', head: true })
        .or(`is_published.eq.true,and(scheduled_at.not.is.null,scheduled_at.lte.${now})`)
        .gt('created_at', lastSeen);

      if (error) {
        return;
      }

      const newCount = count || 0;
      cachedNewPostsCount = newCount;
      setNewPostsCount(newCount);
      if (newCount > 0) {
        appLogger.logInfo('notifications', 'flux.newPosts.count', `${newCount} nouveaux posts détectés`, { count: newCount });
      }
    } catch {
      // Erreur silencieuse - le compteur restera à 0
    } finally {
      setIsLoading(false);
    }
  }, [getLastSeenFlux]);

  const markAsSeen = useCallback(() => {
    try {
      localStorage.setItem(LAST_SEEN_FLUX_KEY, new Date().toISOString());
      cachedNewPostsCount = 0;
      setNewPostsCount(0);
      appLogger.logAction('notifications', 'flux.markAsSeen', 'Flux marqué comme vu');
    } catch {
      // localStorage non disponible
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    fetchNewPostsCount();
  }, [fetchNewPostsCount]);

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('flux_posts_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'flux_posts',
        },
        (payload) => {
          const newPost = payload.new as { is_published: boolean };
          if (newPost.is_published) {
            appLogger.logInfo('notifications', 'flux.realtime.insert', 'Nouveau post publié détecté en temps réel');
            setNewPostsCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flux_posts',
        },
        (payload) => {
          const newPost = payload.new as { is_published: boolean };
          const oldPost = payload.old as { is_published: boolean };

          // Post qui passe de non publié à publié
          if (!oldPost.is_published && newPost.is_published) {
            appLogger.logInfo('notifications', 'flux.realtime.published', 'Post passé à publié en temps réel');
            setNewPostsCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    newPostsCount,
    isLoading,
    markAsSeen,
    refetch: fetchNewPostsCount,
  };
}
