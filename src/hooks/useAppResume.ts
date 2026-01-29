import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Hook qui gère la suspension/reprise de l'app (PWA)
 * Utilise startAutoRefresh/stopAutoRefresh pour éviter la corruption du client Supabase
 * Ref: https://github.com/supabase/supabase/issues/36046
 *
 * FIX V6: Ne pas appeler refreshSession() si l'app était cachée < 30 secondes
 * (pour éviter de perturber les file pickers mobiles)
 */
export const useAppResume = () => {
  const wasHidden = useRef<boolean>(false);
  const hiddenAtRef = useRef<number | null>(null);

  // Durée minimale (en ms) avant de considérer un refresh nécessaire
  // 60 secondes pour couvrir largement les file pickers mobiles
  const MIN_HIDDEN_DURATION = 60000;

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // Tab devient invisible - stopper le refresh auto et noter le timestamp
        wasHidden.current = true;
        hiddenAtRef.current = Date.now();
        await supabase.auth.stopAutoRefresh();
        logger.log('App en arrière-plan - stopAutoRefresh');
      } else if (document.visibilityState === 'visible' && wasHidden.current) {
        // Calculer combien de temps l'app était cachée
        const hiddenDuration = hiddenAtRef.current
          ? Date.now() - hiddenAtRef.current
          : 0;

        // Tab redevient visible - relancer le refresh auto
        wasHidden.current = false;
        hiddenAtRef.current = null;

        logger.log('App au premier plan - startAutoRefresh', { hiddenDuration: Math.round(hiddenDuration / 1000) + 's' });
        await supabase.auth.startAutoRefresh();

        // FIX V6: Ne refresh QUE si l'app était cachée > 30 secondes
        // Cela évite de perturber les file pickers mobiles (qui cachent l'app ~3-10s)
        if (hiddenDuration >= MIN_HIDDEN_DURATION) {
          logger.log('App cachée > 30s - refreshSession() planifié');
          // Délai supplémentaire de 2s pour être safe
          setTimeout(async () => {
            if (document.visibilityState === 'visible') {
              const { error } = await supabase.auth.refreshSession();
              if (error) {
                logger.error('Erreur refresh session:', error);
                // Si la session est expiree/invalide, deconnecter proprement
                // pour eviter un etat inconsistant (routes protegees visibles sans session)
                const msg = error.message || '';
                if (
                  msg.includes('Auth session missing') ||
                  msg.includes('Invalid Refresh Token') ||
                  msg.includes('Refresh Token Not Found') ||
                  error.name === 'AuthSessionMissingError'
                ) {
                  logger.warn('Session expiree apres background - deconnexion propre');
                  await supabase.auth.signOut();
                }
              }
            }
          }, 2000);
        } else {
          logger.log('App cachée < 30s - skip refreshSession() (file picker probable)');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
