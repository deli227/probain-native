import { logger } from '@/utils/logger';

/**
 * Ouvre un lien externe de manière sécurisée pour les PWA
 * Marque qu'on va quitter l'app pour gérer le retour proprement
 */
export const openExternalLink = (url: string, options?: {
  onBeforeOpen?: () => void;
  target?: '_blank' | '_self';
}) => {
  const { onBeforeOpen, target = '_blank' } = options || {};

  logger.log('Ouverture lien externe:', url);

  // Marquer qu'on va quitter l'app
  try {
    sessionStorage.setItem('pwa_external_link', Date.now().toString());
  } catch (e) {
    // sessionStorage peut ne pas être disponible
  }

  // Callback avant ouverture (pour sauvegarder un state par exemple)
  if (onBeforeOpen) {
    onBeforeOpen();
  }

  // Ouvrir dans un nouvel onglet (meilleur pour PWA)
  window.open(url, target, 'noopener,noreferrer');
};

/**
 * Vérifie si on revient d'un lien externe
 */
export const isReturningFromExternalLink = (): boolean => {
  try {
    const timestamp = sessionStorage.getItem('pwa_external_link');
    if (timestamp) {
      const elapsed = Date.now() - parseInt(timestamp);
      // Si moins de 30 minutes, on considère qu'on revient d'un lien externe
      return elapsed < 1000 * 60 * 30;
    }
  } catch (e) {
    // sessionStorage peut ne pas être disponible
  }
  return false;
};

/**
 * Clear le flag de lien externe
 */
export const clearExternalLinkFlag = () => {
  try {
    sessionStorage.removeItem('pwa_external_link');
  } catch (e) {
    // sessionStorage peut ne pas être disponible
  }
};
