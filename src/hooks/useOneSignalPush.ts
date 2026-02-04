import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';
import { isNativeApp, initOneSignalNative, syncOneSignalPlayerId, registerPushNative, logoutOneSignalNative, setOneSignalTagNative } from '@/lib/native';
import { appLogger } from '@/services/appLogger';

/**
 * Hook qui gere l'initialisation OneSignal et l'identification utilisateur.
 *
 * - Native (Despia) : utilise les protocoles Despia (setonesignalplayerid, registerpush)
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
          appLogger.logAction('push', 'native.detected', `appId=${ONESIGNAL_APP_ID}, userId=${userId}`);

          // 1. Initialiser OneSignal avec l'App ID (1 seule fois)
          if (!initializedRef.current) {
            await initOneSignalNative(ONESIGNAL_APP_ID);
            appLogger.logAction('push', 'native.initialized', `appId=${ONESIGNAL_APP_ID}`);
            await registerPushNative();
            appLogger.logAction('push', 'native.permissionRequested', '');
            initializedRef.current = true;
          }

          // 2. Associer l'utilisateur Supabase a OneSignal (CHAQUE lancement)
          await syncOneSignalPlayerId(userId);
          appLogger.logAction('push', 'native.externalIdSet', `userId=${userId}`);

          // 3. Poser le tag profile_type pour le ciblage broadcast
          if (profileType) {
            await setOneSignalTagNative('profile_type', profileType);
            appLogger.logAction('push', 'native.tagSet', `profile_type=${profileType}`);
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
 * - Native (Despia) : genere un ID anonyme unique (best practice Despia)
 * - Web (PWA) : appelle OneSignal.logout()
 */
export async function cleanupOneSignalOnLogout() {
  try {
    if (isNativeApp()) {
      logoutOneSignalNative();
    } else {
      await OneSignal.logout();
    }
    appLogger.logAction('push', 'onesignal.logout', 'User dissociated');
  } catch (e) {
    appLogger.logError('push', 'onesignal.logout.error', e);
  }
}
