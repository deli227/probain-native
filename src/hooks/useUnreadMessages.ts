import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetUser } from '@/utils/asyncHelpers';
import { appLogger } from '@/services/appLogger';

interface UseUnreadMessagesReturn {
  unreadCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// Cache module-level : survit aux remontages de composants, evite le flash des badges a 0
let cachedUnreadCount: number | null = null;

/**
 * Hook pour compter les messages non lus de l'utilisateur connecté
 * - Écoute en temps réel les nouveaux messages
 * - Met à jour le compteur automatiquement
 */
export function useUnreadMessages(): UseUnreadMessagesReturn {
  const [unreadCount, setUnreadCount] = useState(cachedUnreadCount ?? 0);
  const [isLoading, setIsLoading] = useState(cachedUnreadCount === null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      // Compter les messages non lus où l'utilisateur est le destinataire
      const { count, error } = await supabase
        .from('internal_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) {
        return;
      }

      const newCount = count || 0;
      cachedUnreadCount = newCount;
      setUnreadCount(newCount);
    } catch {
      // Erreur silencieuse - le compteur restera à 0
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('internal_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Nouveau message reçu
          appLogger.logInfo('notifications', 'messages.realtime.insert', 'Nouveau message reçu en temps réel');
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          // Message mis à jour (probablement marqué comme lu)
          const newMessage = payload.new as { read: boolean };
          const oldMessage = payload.old as { read: boolean };

          if (oldMessage.read === false && newMessage.read === true) {
            appLogger.logAction('notifications', 'messages.realtime.read', 'Message marqué comme lu en temps réel');
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'internal_messages',
        },
        () => {
          // Message supprimé - refetch pour être sûr
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    refetch: fetchUnreadCount,
  };
}
