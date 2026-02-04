import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { appLogger } from '@/services/appLogger';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notify_messages: boolean;
  notify_formations: boolean;
  notify_job_offers: boolean;
  notify_recycling: boolean;
}

export const useNotificationPreferences = (userId: string | undefined) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPreferences = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        setLoading(false);
        return;
      }

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Créer les préférences par défaut si elles n'existent pas
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: userId })
          .select()
          .single();

        if (!insertError && newData) {
          setPreferences(newData as NotificationPreferences);
        }
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    key: 'notify_messages' | 'notify_formations' | 'notify_job_offers' | 'notify_recycling',
    value: boolean
  ) => {
    if (!userId || !preferences) return;

    // Optimistic update
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [key]: value })
      .eq('user_id', userId);

    if (error) {
      // Revert on error
      setPreferences(prev => prev ? { ...prev, [key]: !value } : null);
      appLogger.logError('notifications', 'preferences.update.error', error, { key, value });
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les préférences',
        variant: 'destructive',
      });
    } else {
      appLogger.logAction('notifications', 'preferences.updated', `${key} = ${value}`, { key, value });
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  return { preferences, loading, updatePreference };
};
