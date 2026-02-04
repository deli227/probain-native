/**
 * Wrapper pour les fonctionnalités natives Despia
 *
 * Ce fichier fournit des fonctions pour interagir avec les APIs natives
 * lorsque l'app tourne dans un environnement Despia (iOS/Android).
 * En mode web, les fonctions sont soit ignorées, soit utilisent des fallbacks web.
 *
 * Documentation Despia: https://docs.despia.com/docs/
 */

import despia from 'despia-native';

// Types pour les retours haptiques
export type HapticType = 'light' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Détecte si l'application tourne dans l'environnement natif Despia
 */
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Despia injecte un objet global ou utilise un schéma d'URL spécifique
  return !!(window as unknown as { despia?: unknown }).despia ||
         window.location.href.startsWith('despia://') ||
         window.location.href.includes('capacitor://') ||
         // Détection alternative via user agent (case-insensitive selon doc Despia)
         navigator.userAgent.toLowerCase().includes('despia');
};

/**
 * Retour haptique natif
 * En mode web, cette fonction ne fait rien
 *
 * @param type - Type de vibration: 'light', 'heavy', 'success', 'warning', 'error'
 */
export const hapticFeedback = (type: HapticType = 'light'): void => {
  if (isNativeApp()) {
    try {
      despia(`${type}haptic://`);
    } catch (error) {
      console.warn('[Native] Haptic feedback failed:', error);
    }
  }
};

/**
 * Authentification biométrique (Face ID, Touch ID, empreinte)
 * En mode web, retourne toujours true (pas de biométrie disponible)
 *
 * @returns Promise<boolean> - true si authentifié, false sinon
 */
export const requestBiometric = async (): Promise<boolean> => {
  if (isNativeApp()) {
    try {
      await despia('biometric://');
      return true;
    } catch (error) {
      console.warn('[Native] Biometric authentication failed:', error);
      return false;
    }
  }
  // En mode web, on considère que l'utilisateur est déjà authentifié
  return true;
};

/**
 * Partage natif (utilise le dialog de partage système)
 * En mode web, utilise l'API Web Share si disponible
 *
 * @param text - Texte à partager
 * @param url - URL optionnelle à partager
 * @param title - Titre optionnel
 */
export const shareNative = async (
  text: string,
  url?: string,
  title?: string
): Promise<boolean> => {
  if (isNativeApp()) {
    try {
      const params = new URLSearchParams();
      params.set('text', text);
      if (url) params.set('url', url);
      if (title) params.set('title', title);

      despia(`share://?${params.toString()}`);
      return true;
    } catch (error) {
      console.warn('[Native] Share failed:', error);
      return false;
    }
  }

  // Fallback vers Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ text, url, title });
      return true;
    } catch (error) {
      // L'utilisateur a annulé ou erreur
      return false;
    }
  }

  return false;
};

/**
 * Obtenir l'UUID unique de l'appareil
 * En mode web, retourne null
 */
export const getDeviceUUID = (): string | null => {
  if (isNativeApp()) {
    try {
      // L'UUID est accessible via despia.uuid selon la doc
      const win = window as unknown as { despia?: { uuid?: string } };
      return win.despia?.uuid || null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Demander la permission pour les notifications push
 * En mode web, utilise l'API Notification standard
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (isNativeApp()) {
    try {
      despia('push-permission://');
      return true;
    } catch (error) {
      console.warn('[Native] Push permission request failed:', error);
      return false;
    }
  }

  // Fallback vers Web Notifications API
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Ouvrir un lien dans le navigateur externe
 * En mode web, ouvre dans un nouvel onglet
 *
 * @param url - URL à ouvrir
 */
export const openExternalLink = (url: string): void => {
  if (isNativeApp()) {
    try {
      despia(`external://?url=${encodeURIComponent(url)}`);
      return;
    } catch (error) {
      console.warn('[Native] External link failed:', error);
    }
  }

  // Fallback web
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Vérifier si l'app est installée (PWA ou native)
 */
export const isAppInstalled = (): boolean => {
  if (isNativeApp()) return true;

  // Vérifier si c'est une PWA installée
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as unknown as { standalone?: boolean }).standalone) return true;

  return false;
};

/**
 * Enregistrer l'utilisateur pour les push notifications sur Despia.
 * Doc: https://github.com/despia-native/despia-native (README lignes 931-1007)
 *
 * Appelle setonesignalplayerid (associe le user Supabase au device OneSignal)
 * et registerpush (enregistre le device pour les push).
 *
 * Fire-and-forget: pas d'attente de reponse, pas de timeout.
 * Doit etre appele a chaque chargement de l'app (recommandation Despia).
 */
export const registerPushNative = (userId: string): void => {
  if (!isNativeApp()) return;
  try {
    despia(`setonesignalplayerid://?user_id=${userId}`);
    despia('registerpush://');
  } catch (error) {
    console.warn('[Native] Push registration failed:', error);
  }
};

/**
 * Dissocier l'utilisateur des push au logout.
 * Set un user_id vide pour deconnecter le device du user.
 */
export const unregisterPushNative = (): void => {
  if (!isNativeApp()) return;
  try {
    despia('setonesignalplayerid://?user_id=');
  } catch (error) {
    console.warn('[Native] Push unregister failed:', error);
  }
};
