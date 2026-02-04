import { useEffect } from 'react';
import { isNativeApp, registerPushNative, unregisterPushNative } from '@/lib/native';
import { appLogger } from '@/services/appLogger';

/**
 * Hook qui gere l'enregistrement push natif via Despia/OneSignal.
 *
 * Sur Despia natif : appelle setonesignalplayerid + registerpush a chaque chargement.
 * Sur web (navigateur) : ne fait rien (push gere uniquement via l'app native Despia).
 *
 * Doc Despia : https://setup.despia.com/native-features/onesignal
 * - setonesignalplayerid://?user_id=... lie le userId Supabase au device OneSignal
 * - registerpush:// enregistre le device pour les push
 *
 * Appele dans ProfileContext avec userId et profileType.
 * Le cleanup au logout est gere par cleanupOneSignalOnLogout() (fonction standalone).
 */
export function useOneSignalPush(userId: string | null, _profileType: string | null) {
  useEffect(() => {
    if (!userId || !isNativeApp()) return;

    try {
      // Fire-and-forget : Despia lie le userId Supabase au device OneSignal
      // Doit etre appele a chaque chargement de l'app (recommandation Despia)
      registerPushNative(userId);
      appLogger.logAction('push', 'native.registered', `userId=${userId}`);
    } catch (error) {
      appLogger.logError('push', 'native.register.error', error);
    }
  }, [userId]);
}

/**
 * Fonction standalone a appeler explicitement au logout (SIGNED_OUT).
 * PAS dans un useEffect cleanup (car userId=null ne trigger pas le cleanup du bon effect).
 *
 * Dissocie le device du user via setonesignalplayerid vide.
 */
export async function cleanupOneSignalOnLogout() {
  try {
    if (isNativeApp()) {
      unregisterPushNative();
    }
    appLogger.logAction('push', 'onesignal.logout', 'User dissociated');
  } catch (e) {
    appLogger.logError('push', 'onesignal.logout.error', e);
  }
}
