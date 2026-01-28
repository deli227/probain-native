import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetUser } from '@/utils/asyncHelpers';

interface UseUnreadMessagesReturn {
  unreadCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook pour compter les messages non lus de l'utilisateur connecté
 * - Écoute en temps réel les nouveaux messages
 * - Met à jour le compteur automatiquement
 */
export function useUnreadMessages(): UseUnreadMessagesReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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

      setUnreadCount(count || 0);
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
