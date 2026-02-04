import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { safeGetUser } from '@/utils/asyncHelpers';
import { appLogger } from '@/services/appLogger';

interface NotificationCounts {
  formations: number;
  jobs: number;
  total: number;
}

interface UseRescuerNotificationsReturn {
  counts: NotificationCounts;
  isLoading: boolean;
  markFormationsAsSeen: () => Promise<void>;
  markJobsAsSeen: () => Promise<void>;
  markAllAsSeen: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook pour gérer les notifications des sauveteurs
 * - Compte les nouvelles formations depuis la dernière visite
 * - Compte les nouvelles offres d'emploi depuis la dernière visite
 * - Met à jour en temps réel
 * - Permet de marquer comme vu (persiste en base)
 */
export function useRescuerNotifications(): UseRescuerNotificationsReturn {
  const [counts, setCounts] = useState<NotificationCounts>({
    formations: 0,
    jobs: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer les counts de notifications
  const fetchNotificationCounts = useCallback(async () => {
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      // Récupérer le statut de notification de l'utilisateur
      const statusResult = await supabase
        .from('user_notification_status')
        .select('last_seen_formations_at, last_seen_jobs_at')
        .eq('user_id', user.id)
        .single();

      let status = statusResult.data;
      const statusError = statusResult.error;

      // Si pas de statut, en créer un
      if (statusError?.code === 'PGRST116') {
        const { data: newStatus, error: insertError } = await supabase
          .from('user_notification_status')
          .insert({ user_id: user.id })
          .select('last_seen_formations_at, last_seen_jobs_at')
          .single();

        if (insertError) {
          logger.error('Erreur création statut notification:', insertError);
          setIsLoading(false);
          return;
        }
        status = newStatus;
      } else if (statusError) {
        logger.error('Erreur récupération statut notification:', statusError);
        setIsLoading(false);
        return;
      }

      // IMPORTANT: Si pas de statut, utiliser NOW() comme fallback
      // NE PAS utiliser Date(0) car cela compterait TOUTES les formations comme "nouvelles"
      // Ce qui cause le bug des "1000" notifications
      const now = new Date().toISOString();
      const lastSeenFormations = status?.last_seen_formations_at || now;
      const lastSeenJobs = status?.last_seen_jobs_at || now;

      // Compter les nouvelles formations (créées après la dernière visite)
      const { count: formationsCount, error: formationsError } = await supabase
        .from('sss_formations_cache')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .gt('created_at', lastSeenFormations);

      if (formationsError) {
        logger.error('Erreur comptage formations:', formationsError);
      }

      // Compter les nouvelles offres d'emploi (créées après la dernière visite)
      const { count: jobsCount, error: jobsError } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastSeenJobs);

      if (jobsError) {
        logger.error('Erreur comptage emplois:', jobsError);
      }

      const formationsNew = formationsCount || 0;
      const jobsNew = jobsCount || 0;

      setCounts({
        formations: formationsNew,
        jobs: jobsNew,
        total: formationsNew + jobsNew,
      });

      appLogger.logAction('notifications', 'rescuer.counts.fetched', `formations=${formationsNew}, jobs=${jobsNew}`, { formations: formationsNew, jobs: jobsNew });
      logger.log(`📬 Notifications: ${formationsNew} formations, ${jobsNew} emplois`);
    } catch (error) {
      logger.error('Erreur fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marquer les formations comme vues
  const markFormationsAsSeen = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_notification_status')
        .update({ last_seen_formations_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        logger.error('Erreur mise à jour last_seen_formations_at:', error);
        return;
      }

      setCounts(prev => ({
        ...prev,
        formations: 0,
        total: prev.jobs,
      }));

      appLogger.logAction('notifications', 'rescuer.formations.seen', 'Formations marquées comme vues');
      logger.log('✅ Formations marquées comme vues');
    } catch (error) {
      logger.error('Erreur markFormationsAsSeen:', error);
    }
  }, [userId]);

  // Marquer les emplois comme vus
  const markJobsAsSeen = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_notification_status')
        .update({ last_seen_jobs_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        logger.error('Erreur mise à jour last_seen_jobs_at:', error);
        return;
      }

      setCounts(prev => ({
        ...prev,
        jobs: 0,
        total: prev.formations,
      }));

      appLogger.logAction('notifications', 'rescuer.jobs.seen', 'Emplois marqués comme vus');
      logger.log('✅ Emplois marqués comme vus');
    } catch (error) {
      logger.error('Erreur markJobsAsSeen:', error);
    }
  }, [userId]);

  // Marquer tout comme vu
  const markAllAsSeen = useCallback(async () => {
    if (!userId) return;

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('user_notification_status')
        .update({
          last_seen_formations_at: now,
          last_seen_jobs_at: now,
        })
        .eq('user_id', userId);

      if (error) {
        logger.error('Erreur mise à jour tout vu:', error);
        return;
      }

      setCounts({
        formations: 0,
        jobs: 0,
        total: 0,
      });

      appLogger.logAction('notifications', 'rescuer.all.seen', 'Tout marqué comme vu');
      logger.log('✅ Tout marqué comme vu');
    } catch (error) {
      logger.error('Erreur markAllAsSeen:', error);
    }
  }, [userId]);

  // Charger au montage
  useEffect(() => {
    fetchNotificationCounts();
  }, [fetchNotificationCounts]);

  // Écouter les changements en temps réel sur les formations
  useEffect(() => {
    const formationsChannel = supabase
      .channel('sss_formations_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sss_formations_cache',
        },
        (payload) => {
          logger.log('🔔 Nouvelle formation détectée:', payload);
          appLogger.logInfo('notifications', 'rescuer.realtime.formation', 'Nouvelle formation détectée en temps réel');
          // Incrémenter le compteur
          setCounts(prev => ({
            ...prev,
            formations: prev.formations + 1,
            total: prev.total + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(formationsChannel);
    };
  }, []);

  // Écouter les changements en temps réel sur les emplois
  useEffect(() => {
    const jobsChannel = supabase
      .channel('job_postings_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_postings',
        },
        (payload) => {
          logger.log('🔔 Nouvelle offre d\'emploi détectée:', payload);
          appLogger.logInfo('notifications', 'rescuer.realtime.job', 'Nouvelle offre d\'emploi détectée en temps réel');
          // Incrémenter le compteur
          setCounts(prev => ({
            ...prev,
            jobs: prev.jobs + 1,
            total: prev.total + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobsChannel);
    };
  }, []);

  return {
    counts,
    isLoading,
    markFormationsAsSeen,
    markJobsAsSeen,
    markAllAsSeen,
    refetch: fetchNotificationCounts,
  };
}
