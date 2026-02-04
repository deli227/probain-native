import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';
import { isNativeApp, getOneSignalPlayerIdNative } from '@/lib/native';
import { appLogger } from '@/services/appLogger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook qui gere l'initialisation OneSignal et l'identification utilisateur.
 *
 * - Native (Despia) : recupere le Player ID via Despia et l'enregistre dans push_subscriptions
 * - Web (PWA) : utilise le SDK react-onesignal
 *
 * Appele dans ProfileContext avec userId et profileType.
 * Le cleanup au logout est gere par cleanupOneSignalOnLogout() (fonction standalone).
 */
export function useOneSignalPush(userId: string | null, profileType: string | null) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      try {
        if (isNativeApp()) {
          // === DESPIA NATIVE PATH ===
          // Despia integre le SDK OneSignal natif — on recupere juste le Player ID
          // et on le stocke dans push_subscriptions pour le ciblage par l'Edge Function
          appLogger.logAction('push', 'native.detected', `userId=${userId}`);

          const playerId = await getOneSignalPlayerIdNative();

          if (playerId) {
            appLogger.logAction('push', 'native.playerIdObtained', `playerId=${playerId}`);

            // Upsert dans push_subscriptions (ON CONFLICT = update)
            const { error } = await supabase
              .from('push_subscriptions')
              .upsert(
                {
                  user_id: userId,
                  player_id: playerId,
                  platform: 'native',
                  profile_type: profileType || null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,player_id' }
              );

            if (error) {
              appLogger.logError('push', 'native.upsert.error', error);
            } else {
              appLogger.logAction('push', 'native.registered', `playerId=${playerId}, profileType=${profileType}`);
            }
          } else {
            appLogger.logAction('push', 'native.noPlayerId', 'Player ID not available from Despia');
          }
        } else {
          // === WEB PUSH PATH ===
          // react-onesignal — init() ne doit etre appele qu'UNE fois
          // (React.StrictMode appelle les effects 2x en dev → guard avec ref)
          if (!initializedRef.current && ONESIGNAL_APP_ID) {
            await OneSignal.init({
              appId: ONESIGNAL_APP_ID,
              allowLocalhostAsSecureOrigin: import.meta.env.DEV,
              serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
              serviceWorkerParam: { scope: '/push/onesignal/js/' },
            });
            initializedRef.current = true;
          }

          if (ONESIGNAL_APP_ID) {
            // login() remplace setExternalUserId() (deprecie dans OneSignal v5+)
            await OneSignal.login(userId);

            // addTag APRES login (le user doit exister dans OneSignal)
            await OneSignal.User.addTag('profile_type', profileType || '');

            // Soft prompt (slidedown) — texte FR configure dans le dashboard OneSignal
            await OneSignal.Slidedown.promptPush();
          }
        }

        appLogger.logAction('push', 'onesignal.initialized', `userId=${userId}, native=${isNativeApp()}`);
      } catch (error) {
        appLogger.logError('push', 'onesignal.init.error', error);
      }
    };

    init();
  }, [userId, profileType]);
}

/**
 * Fonction standalone a appeler explicitement au logout (SIGNED_OUT).
 * PAS dans un useEffect cleanup (car userId=null ne trigger pas le cleanup du bon effect).
 *
 * - Native (Despia) : supprime les rows de push_subscriptions pour cet appareil
 * - Web (PWA) : appelle OneSignal.logout()
 */
export async function cleanupOneSignalOnLogout() {
  try {
    if (isNativeApp()) {
      // Recuperer le player ID pour supprimer le bon row
      const playerId = await getOneSignalPlayerIdNative();
      if (playerId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', session.user.id)
            .eq('player_id', playerId);
        }
      }
    } else {
      await OneSignal.logout();
    }
    appLogger.logAction('push', 'onesignal.logout', 'User dissociated');
  } catch (e) {
    appLogger.logError('push', 'onesignal.logout.error', e);
  }
}
